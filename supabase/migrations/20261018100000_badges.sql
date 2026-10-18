-- Phase 5: badges, earned on the server when one of the child's measures reaches a threshold.
--
-- The catalog mirrors packages/shared/src/badges.ts (badges.test.ts compares them); titles and
-- descriptions are in the app (fr.ts). Measures come from the server's own data only: regraded
-- answers, streak, chests and mastery. Badges are granted when a session is awarded, and the new
-- ones come back with its award.

create type public.badge_category as enum ('regularity', 'mastery', 'discovery', 'progression');

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  category public.badge_category not null,
  -- A key of private.badge_metrics.
  metric text not null,
  threshold integer not null check (threshold > 0),
  position smallint not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.child_badges (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  badge_code text not null references public.badges (code),
  -- The session whose award granted it (null for badges granted when this table was created).
  session_id uuid references public.sessions (id) on delete set null,
  earned_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, badge_code)
);

create trigger badges_updated_at before update on public.badges
  for each row execute function private.set_updated_at();
create trigger child_badges_updated_at before update on public.child_badges
  for each row execute function private.set_updated_at();

alter table public.badges enable row level security;
alter table public.child_badges enable row level security;

create policy "Everyone signed in reads the badge catalog" on public.badges
  for select to authenticated
  using (true);

create policy "Parents and devices read their children's badges" on public.child_badges
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

-- Badges are granted by award_session only; no insert, update or delete policy exists.

insert into public.badges (code, category, metric, threshold, position) values
  ('streak-3', 'regularity', 'streak_best', 3, 1),
  ('streak-7', 'regularity', 'streak_best', 7, 2),
  ('streak-14', 'regularity', 'streak_best', 14, 3),
  ('streak-30', 'regularity', 'streak_best', 30, 4),
  ('streak-50', 'regularity', 'streak_best', 50, 5),
  ('streak-100', 'regularity', 'streak_best', 100, 6),
  ('streak-365', 'regularity', 'streak_best', 365, 7),
  ('sessions-1', 'regularity', 'validated_daily', 1, 8),
  ('sessions-10', 'regularity', 'validated_daily', 10, 9),
  ('sessions-25', 'regularity', 'validated_daily', 25, 10),
  ('sessions-50', 'regularity', 'validated_daily', 50, 11),
  ('sessions-100', 'regularity', 'validated_daily', 100, 12),
  ('weekend', 'regularity', 'weekend_sessions', 1, 13),
  ('comeback', 'regularity', 'comebacks', 1, 14),
  ('mastery-1', 'mastery', 'mastered_skills', 1, 15),
  ('mastery-5', 'mastery', 'mastered_skills', 5, 16),
  ('mastery-10', 'mastery', 'mastered_skills', 10, 17),
  ('mastery-25', 'mastery', 'mastered_skills', 25, 18),
  ('tables', 'mastery', 'tables_mastered', 1, 19),
  ('mental-math', 'mastery', 'automatisms_mastered', 3, 20),
  ('all-domains', 'mastery', 'mastered_domains', 4, 21),
  ('combo-10', 'mastery', 'best_combo', 10, 22),
  ('combo-25', 'mastery', 'best_combo', 25, 23),
  ('perfect-5', 'mastery', 'perfect_sessions', 5, 24),
  ('perfect-20', 'mastery', 'perfect_sessions', 20, 25),
  ('answers-100', 'mastery', 'correct_answers', 100, 26),
  ('answers-1000', 'mastery', 'correct_answers', 1000, 27),
  ('answers-5000', 'mastery', 'correct_answers', 5000, 28),
  ('perfect-1', 'discovery', 'perfect_sessions', 1, 29),
  ('bonus-1', 'discovery', 'bonus_sessions', 1, 30),
  ('rare-chest', 'discovery', 'rare_chests', 1, 31),
  ('explorer-10', 'discovery', 'explored_skills', 10, 32),
  ('explorer-25', 'discovery', 'explored_skills', 25, 33),
  ('gems-100', 'discovery', 'gems_earned', 100, 34),
  ('level-5', 'progression', 'level', 5, 35),
  ('level-10', 'progression', 'level', 10, 36),
  ('level-20', 'progression', 'level', 20, 37);

-- Measures -------------------------------------------------------------------------------------

-- Everything a badge can ask for, from awarded sessions (graded again by the server), the
-- streak, chests, gems and mastery. Keys: BADGE_METRICS in packages/shared/src/badges.ts.
create function private.badge_metrics(p_child_id uuid) returns jsonb
language sql stable
set search_path = ''
as $$
  with awarded as (
    select s.id, s.kind, s.local_date, s.answered, s.verified_correct, s.goal_met, s.award
    from public.sessions s
    where s.child_id = p_child_id and s.awarded_at is not null
  ),
  answers as (
    select a.session_id, a.position, a.skill_code,
      coalesce(a.verified, false) as right_answer,
      -- As for XP (private.session_xp): right, and not too fast to count.
      coalesce(a.verified, false) and a.time_ms >= 1200 as counted
    from public.attempts a
    join awarded s on s.id = a.session_id
  ),
  -- Counted answers in a row: within a run, position minus rank stays the same.
  runs as (
    select count(*) as run_length
    from (
      select r.session_id,
        r.position - row_number() over (partition by r.session_id order by r.position) as run
      from answers r
      where r.counted
    ) numbered
    group by numbered.session_id, numbered.run
  ),
  mastered as (
    select k.code, k.domain, k.automatism
    from public.child_skill_mastery m
    join public.skills k on k.code = m.skill_code
    where m.child_id = p_child_id and m.mastered_at is not null
  ),
  current as (
    select p.streak_best, p.level from public.progress p where p.child_id = p_child_id
  )
  select jsonb_build_object(
    'streak_best', coalesce((select c.streak_best from current c), 0),
    'validated_daily', (select count(*) from awarded s where s.kind = 'daily' and s.goal_met),
    'weekend_sessions',
      (select count(*) from awarded s where extract(isodow from s.local_date) in (6, 7)),
    'comebacks', (select count(*) from awarded s
      where (s.award ->> 'streak')::integer = 1 and (s.award ->> 'streak_best')::integer >= 3),
    'mastered_skills', (select count(*) from mastered),
    'tables_mastered', (select count(*) from mastered m where m.code like '%.tables-multiplication'),
    'automatisms_mastered', (select count(*) from mastered m where m.automatism),
    'mastered_domains', (select count(distinct m.domain) from mastered m),
    'best_combo', coalesce((select max(r.run_length) from runs r), 0),
    'perfect_sessions', (select count(*) from awarded s
      where s.answered >= 10 and s.verified_correct = s.answered),
    'correct_answers', (select count(*) from answers a where a.right_answer),
    'bonus_sessions', (select count(*) from awarded s where s.kind = 'bonus'),
    'rare_chests',
      (select count(*) from public.chests c where c.child_id = p_child_id and c.kind = 'rare'),
    'explored_skills', (select count(distinct a.skill_code) from answers a where a.right_answer),
    'gems_earned', (select coalesce(sum(g.amount), 0) from public.gem_transactions g
      where g.child_id = p_child_id and g.amount > 0),
    'level', coalesce((select c.level from current c), 1)
  );
$$;

-- Grants every badge the child has reached; returns the new ones, in catalog order.
create function private.grant_badges(p_child_id uuid, p_session_id uuid, p_now timestamptz)
returns text[]
language plpgsql
set search_path = ''
as $$
declare
  metrics jsonb := private.badge_metrics(p_child_id);
  granted text[];
begin
  with inserted as (
    insert into public.child_badges (child_id, badge_code, session_id, earned_at)
    select p_child_id, b.code, p_session_id, p_now
    from public.badges b
    where coalesce((metrics ->> b.metric)::integer, 0) >= b.threshold
    on conflict (child_id, badge_code) do nothing
    returning badge_code
  )
  select coalesce(array_agg(i.badge_code order by b.position), '{}')
  into granted
  from inserted i
  join public.badges b on b.code = i.badge_code;
  return granted;
end;
$$;

-- What else a session earns, merged into its award. Later steps of phase 5 add to it.
create function private.award_extras(p_session public.sessions, p_now timestamptz)
returns jsonb
language sql
set search_path = ''
as $$
  select jsonb_build_object(
    'badges', to_jsonb(private.grant_badges(p_session.child_id, p_session.id, p_now))
  );
$$;

-- The badges screen shows how far the child is from each badge.
create function public.child_badge_metrics(p_child_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if p_child_id is null or p_child_id not in (select private.accessible_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  return private.badge_metrics(p_child_id);
end;
$$;

-- Awarding -------------------------------------------------------------------------------------

-- As in the rewards migration, plus the extras (badges), merged into the stored award.
-- Called by the award-session Edge Function (service role only) with the server's verdicts
-- ([{position, correct}]). Awards a finished session once; later calls return the same award.
create or replace function public.award_session(
  p_session_id uuid,
  p_verdicts jsonb,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  session public.sessions;
  before public.progress;
  after public.progress;
  today date;
  verified smallint;
  earned_xp integer;
  earned_gems integer := 0;
  rare boolean;
  chest public.chests;
  result jsonb;
begin
  select * into session from public.sessions s where s.id = p_session_id for update;
  if session.id is null then
    raise exception 'session_not_found' using errcode = 'PT404';
  end if;
  if session.awarded_at is not null then
    return session.award;
  end if;
  if session.completed_at is null then
    raise exception 'session_not_completed' using errcode = 'PT409';
  end if;

  today := private.child_today(session.child_id, p_now);
  before := private.refresh_progress(session.child_id, today);

  update public.attempts a
  set verified = v.correct
  from jsonb_to_recordset(coalesce(p_verdicts, '[]')) as v (position smallint, correct boolean)
  where a.session_id = session.id and a.position = v.position;

  select (count(*) filter (where a.verified))::smallint into verified
  from public.attempts a where a.session_id = session.id;
  earned_xp := private.session_xp(session.id);

  -- The server's grading can only lower the validation computed from the device's verdicts.
  update public.sessions s
  set verified_correct = verified,
      xp_awarded = earned_xp,
      awarded_at = p_now,
      goal_met = s.goal_met and verified >= 0.6 * s.answered
  where s.id = session.id
  returning * into session;

  if session.kind = 'daily' and session.goal_met then
    insert into public.gem_transactions (child_id, amount, reason, ref_id, local_date)
    values (session.child_id, 5, 'session', session.id, session.local_date)
    on conflict do nothing;
    earned_gems := 5;
  end if;

  after := private.refresh_progress(session.child_id, today);

  if session.kind = 'daily' then
    rare := after.streak_last_date = session.local_date and after.streak_current % 7 = 0;
    insert into public.chests (child_id, session_id, local_date, kind, gems)
    values (
      session.child_id, session.id, session.local_date,
      case when rare then 'rare' else 'common' end::public.chest_kind,
      private.chest_gems(session.id, case when rare then 'rare' else 'common' end::public.chest_kind)
    )
    on conflict (child_id, local_date) do nothing
    returning * into chest;
  end if;

  result := jsonb_build_object(
    'session_id', session.id,
    'xp', earned_xp,
    'verified_correct', verified,
    'answered', session.answered,
    'goal_met', session.goal_met,
    'gems', earned_gems,
    'chest', case when chest.id is null then null
      else jsonb_build_object('id', chest.id, 'kind', chest.kind) end,
    'level', after.level,
    'level_before', before.level,
    'xp_total', after.xp,
    'streak', after.streak_current,
    'streak_before', before.streak_current,
    'streak_best', after.streak_best
  );
  -- Stored before the extras, which read it (a comeback is a streak that starts again).
  update public.sessions s set award = result where s.id = session.id;
  result := result || private.award_extras(session, p_now);
  update public.sessions s set award = result where s.id = session.id;
  return result;
end;
$$;

revoke all on function private.badge_metrics(uuid) from public;
revoke all on function private.grant_badges(uuid, uuid, timestamptz) from public;
revoke all on function private.award_extras(public.sessions, timestamptz) from public;
revoke all on function public.child_badge_metrics(uuid) from public, anon;
grant execute on function public.child_badge_metrics(uuid) to authenticated;

-- Children who already played get the badges they have reached.
select private.grant_badges(c.id, null, now()) from public.children c;
