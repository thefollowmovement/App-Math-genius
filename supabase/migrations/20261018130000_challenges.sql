-- Phase 5: weekly challenges. One a week, the same for every child, from Monday to Sunday in
-- the family's time zone, in turn from Monday 5 January 2026. The catalog and the rotation mirror
-- packages/shared/src/challenges.ts (challenges.test.ts and this migration's test share their
-- cases). Measured on the week's awarded sessions (graded again by the server); once reached, the
-- next award pays its gems, once, and says so.

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  -- A key of private.week_metrics.
  metric text not null,
  threshold integer not null check (threshold > 0),
  gems integer not null check (gems > 0),
  position smallint not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.challenge_completions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  -- Monday of the week.
  week_start date not null check (extract(isodow from week_start) = 1),
  challenge_code text not null references public.challenges (code),
  session_id uuid references public.sessions (id) on delete set null,
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, week_start)
);

create trigger challenges_updated_at before update on public.challenges
  for each row execute function private.set_updated_at();
create trigger challenge_completions_updated_at before update on public.challenge_completions
  for each row execute function private.set_updated_at();

alter table public.challenges enable row level security;
alter table public.challenge_completions enable row level security;

create policy "Everyone signed in reads the challenges" on public.challenges
  for select to authenticated
  using (true);

create policy "Parents and devices read their children's challenges" on public.challenge_completions
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

-- Completed by award_session only; no insert, update or delete policy exists.

insert into public.challenges (code, metric, threshold, gems, position) values
  ('daily-5', 'validated_daily', 5, 20, 1),
  ('correct-150', 'correct_answers', 150, 20, 2),
  ('combo-10', 'best_combo', 10, 15, 3),
  ('skills-6', 'explored_skills', 6, 20, 4),
  ('perfect-1', 'perfect_sessions', 1, 25, 5),
  ('minutes-60', 'minutes', 60, 20, 6);

-- The challenge of the week starting on p_week_start (a Monday).
create function private.challenge_of_week(p_week_start date) returns public.challenges
language sql stable
set search_path = ''
as $$
  select c.* from public.challenges c
  order by c.position
  offset (
    select mod(mod((p_week_start - date '2026-01-05') / 7, count(*)::integer) + count(*)::integer,
      count(*)::integer)
    from public.challenges
  )
  limit 1;
$$;

-- What the week's awarded sessions add up to. Keys: CHALLENGE_METRICS in challenges.ts.
create function private.week_metrics(p_child_id uuid, p_week_start date) returns jsonb
language sql stable
set search_path = ''
as $$
  with week as (
    select s.id, s.kind, s.answered, s.verified_correct, s.goal_met, s.duration_s
    from public.sessions s
    where s.child_id = p_child_id and s.awarded_at is not null
      and s.local_date between p_week_start and p_week_start + 6
  ),
  answers as (
    select a.session_id, a.position, a.skill_code,
      coalesce(a.verified, false) as right_answer,
      -- As for XP (private.session_xp): right, and not too fast to count.
      coalesce(a.verified, false) and a.time_ms >= 1200 as counted
    from public.attempts a
    join week s on s.id = a.session_id
  ),
  runs as (
    select count(*) as run_length
    from (
      select r.session_id,
        r.position - row_number() over (partition by r.session_id order by r.position) as run
      from answers r
      where r.counted
    ) numbered
    group by numbered.session_id, numbered.run
  )
  select jsonb_build_object(
    'validated_daily', (select count(*) from week s where s.kind = 'daily' and s.goal_met),
    'correct_answers', (select count(*) from answers a where a.right_answer),
    'best_combo', coalesce((select max(r.run_length) from runs r), 0),
    'explored_skills', (select count(distinct a.skill_code) from answers a where a.right_answer),
    'perfect_sessions', (select count(*) from week s
      where s.answered >= 10 and s.verified_correct = s.answered),
    'minutes', (select coalesce(sum(s.duration_s), 0) / 60 from week s)
  );
$$;

-- Completes the week's challenge of a session once it is reached, and pays its gems. Returns the
-- challenge completed by this session, if any.
create function private.settle_challenge(p_session public.sessions, p_now timestamptz)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  monday date := date_trunc('week', p_session.local_date)::date;
  challenge public.challenges := private.challenge_of_week(monday);
  completion public.challenge_completions;
begin
  if coalesce((private.week_metrics(p_session.child_id, monday) ->> challenge.metric)::integer, 0)
    < challenge.threshold then
    return null;
  end if;
  insert into public.challenge_completions (
    child_id, week_start, challenge_code, session_id, completed_at
  )
  values (p_session.child_id, monday, challenge.code, p_session.id, p_now)
  on conflict (child_id, week_start) do nothing
  returning * into completion;
  if completion.id is null then
    return null;
  end if;
  insert into public.gem_transactions (child_id, amount, reason, ref_id, local_date)
  values (p_session.child_id, challenge.gems, 'challenge', completion.id, p_session.local_date);
  perform private.refresh_progress(
    p_session.child_id, private.child_today(p_session.child_id, p_now)
  );
  return jsonb_build_object('code', challenge.code, 'gems', challenge.gems);
end;
$$;

-- This week's challenge for the child's home: what it asks, and how far the child is.
create function public.weekly_challenge(p_child_id uuid, p_now timestamptz default now())
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  monday date;
  challenge public.challenges;
begin
  if p_child_id is null or p_child_id not in (select private.accessible_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  monday := date_trunc('week', private.child_today(p_child_id, p_now))::date;
  challenge := private.challenge_of_week(monday);
  return jsonb_build_object(
    'code', challenge.code,
    'threshold', challenge.threshold,
    'gems', challenge.gems,
    'week_start', monday,
    'progress', least(
      challenge.threshold,
      coalesce((private.week_metrics(p_child_id, monday) ->> challenge.metric)::integer, 0)
    ),
    'completed', exists (
      select 1 from public.challenge_completions c
      where c.child_id = p_child_id and c.week_start = monday
    )
  );
end;
$$;

-- Badge measures: those of the islands migration, plus completed challenges.
alter function private.badge_metrics(uuid) rename to island_badge_metrics;

create function private.badge_metrics(p_child_id uuid) returns jsonb
language sql stable
set search_path = ''
as $$
  select private.island_badge_metrics(p_child_id) || jsonb_build_object(
    'challenges_completed',
      (select count(*) from public.challenge_completions c where c.child_id = p_child_id)
  );
$$;

-- The boss, then the week's challenge, then the badges (which count both).
create or replace function private.award_extras(p_session public.sessions, p_now timestamptz)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  boss jsonb;
  challenge jsonb := private.settle_challenge(p_session, p_now);
begin
  if p_session.kind = 'boss' then
    boss := private.settle_boss(p_session, p_now);
  end if;
  -- Only what happened is told: a boss for a boss session, a challenge once completed.
  return jsonb_build_object(
    'badges', to_jsonb(private.grant_badges(p_session.child_id, p_session.id, p_now))
  )
    || case when boss is null then '{}'::jsonb else jsonb_build_object('boss', boss) end
    || case when challenge is null then '{}'::jsonb
      else jsonb_build_object('challenge', challenge) end;
end;
$$;

insert into public.badges (code, category, metric, threshold, position) values
  ('challenge-1', 'discovery', 'challenges_completed', 1, 42),
  ('challenge-5', 'regularity', 'challenges_completed', 5, 43);

revoke all on function private.challenge_of_week(date) from public;
revoke all on function private.week_metrics(uuid, date) from public;
revoke all on function private.settle_challenge(public.sessions, timestamptz) from public;
revoke all on function private.badge_metrics(uuid) from public;
revoke all on function public.weekly_challenge(uuid, timestamptz) from public, anon;
grant execute on function public.weekly_challenge(uuid, timestamptz) to authenticated;
