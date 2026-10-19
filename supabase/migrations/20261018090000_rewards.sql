-- Phase 5: rewards, computed on the server from regraded answers.
--
-- Once a session is finished, the award-session Edge Function rebuilds each exercise with the
-- engine, grades the stored answer again and calls award_session with its verdicts. XP, gems,
-- streak and chest are computed here from those verdicts only, never from what the device said.
-- The rules mirror packages/shared/src/rewards.ts: change both.

create type public.chest_kind as enum ('common', 'rare');
create type public.gem_reason as enum ('session', 'chest', 'freeze', 'shop', 'challenge');

alter table public.sessions
  -- Right answers by the server's own grading, and what the session earned.
  add column verified_correct smallint,
  add column xp_awarded integer,
  add column award jsonb,
  add column awarded_at timestamptz;

-- The server's verdict on the answer; null until regraded, or if the exercise is unknown to it.
alter table public.attempts add column verified boolean;

create table public.progress (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null unique references public.children (id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  level smallint not null default 1 check (level >= 1),
  gems integer not null default 0 check (gems >= 0),
  streak_current smallint not null default 0 check (streak_current >= 0),
  streak_best smallint not null default 0 check (streak_best >= 0),
  -- Last day that counted in the streak, in the child's calendar.
  streak_last_date date,
  freezes smallint not null default 1 check (freezes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Every gem won or spent; the balance is their sum.
create table public.gem_transactions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  amount integer not null check (amount <> 0),
  reason public.gem_reason not null,
  -- The session, chest or item it comes from: each pays once.
  ref_id uuid,
  local_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reason, ref_id)
);
create index gem_transactions_child_id_idx on public.gem_transactions (child_id, reason, local_date);

-- One chest per finished daily session, opened by the child; its gems are drawn when it is won.
create table public.chests (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  session_id uuid not null unique references public.sessions (id) on delete cascade,
  local_date date not null,
  kind public.chest_kind not null,
  gems smallint not null check (gems > 0),
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, local_date)
);

create trigger progress_updated_at before update on public.progress
  for each row execute function private.set_updated_at();
create trigger gem_transactions_updated_at before update on public.gem_transactions
  for each row execute function private.set_updated_at();
create trigger chests_updated_at before update on public.chests
  for each row execute function private.set_updated_at();

alter table public.progress enable row level security;
alter table public.gem_transactions enable row level security;
alter table public.chests enable row level security;

create policy "Parents and devices read their children's progress" on public.progress
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

create policy "Parents and devices read their children's gems" on public.gem_transactions
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

create policy "Parents and devices read their children's chests" on public.chests
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

-- Writes go through the functions below; no insert, update or delete policy exists.

-- Rules ------------------------------------------------------------------------------------------

-- Largest level L with 50 × L × (L − 1) ≤ xp: 0, 100, 300, 600, 1000… (xpForLevel).
create function private.level_for_xp(p_xp integer) returns smallint
language sql immutable
set search_path = ''
as $$
  select greatest(1, floor((1 + sqrt(1 + greatest(p_xp, 0) / 12.5)) / 2))::smallint;
$$;

-- 10 XP per right answer (by the server's grading, not too fast to count), and 10 more every
-- 5 right answers in a row.
create function private.session_xp(p_session_id uuid) returns integer
language plpgsql stable
set search_path = ''
as $$
declare
  min_answer_ms constant integer := 1200;
  answer record;
  run integer := 0;
  total integer := 0;
begin
  for answer in
    select a.verified, a.time_ms from public.attempts a
    where a.session_id = p_session_id
    order by a.position
  loop
    if answer.verified and answer.time_ms >= min_answer_ms then
      total := total + 10;
      run := run + 1;
      if run % 5 = 0 then
        total := total + 10;
      end if;
    else
      run := 0;
    end if;
  end loop;
  return total;
end;
$$;

-- Gems in a chest, drawn from its session: 5 to 15, or 25 to 50 for a rare one.
create function private.chest_gems(p_session_id uuid, p_kind public.chest_kind) returns smallint
language sql immutable
set search_path = ''
as $$
  select case p_kind
    when 'rare' then 25 + ((hashtext(p_session_id::text)::bigint % 26) + 26) % 26
    else 5 + ((hashtext(p_session_id::text)::bigint % 11) + 11) % 11
  end::smallint;
$$;

-- The child's calendar day at p_now.
create function private.child_today(p_child_id uuid, p_now timestamptz) returns date
language sql stable
set search_path = ''
as $$
  select (p_now at time zone f.timezone)::date
  from public.children c
  join public.families f on f.id = c.family_id
  where c.id = p_child_id;
$$;

-- Streak and freezes, replayed over the whole history so that a session synced late (played
-- offline) still counts on its own day. A day counts when its daily session is finished and
-- awarded. A missed day breaks the streak unless a freeze covers it: the free one, given back
-- every Monday, then those bought with gems. Days off and holidays are ignored; without a
-- routine, every day is planned. Today cannot be missed yet.
create function private.streak_state(p_child_id uuid, p_today date)
returns table (current_streak smallint, best_streak smallint, last_kept date, freezes smallint)
language plpgsql stable
set search_path = ''
as $$
declare
  has_routine constant boolean := exists (
    select 1 from public.routines r where r.child_id = p_child_id
  );
  free_left smallint := 1;
  bought smallint := 0;
  start_date date;
  d date;
begin
  current_streak := 0;
  best_streak := 0;
  select least(
    (select min(s.local_date) from public.sessions s
     where s.child_id = p_child_id and s.kind = 'daily' and s.awarded_at is not null),
    (select min(g.local_date) from public.gem_transactions g
     where g.child_id = p_child_id and g.reason = 'freeze')
  ) into start_date;

  if start_date is not null then
    for d in select generate_series(start_date, p_today, interval '1 day')::date loop
      if extract(isodow from d) = 1 and d > start_date then
        free_left := 1;
      end if;
      bought := bought + (
        select count(*) from public.gem_transactions g
        where g.child_id = p_child_id and g.reason = 'freeze' and g.local_date = d
      );

      if exists (
        select 1 from public.sessions s
        where s.child_id = p_child_id and s.local_date = d and s.kind = 'daily'
          and s.awarded_at is not null
      ) then
        current_streak := current_streak + 1;
        best_streak := greatest(best_streak, current_streak);
        last_kept := d;
      elsif d < p_today and current_streak > 0
        and (not has_routine or exists (select 1 from private.day_plan(p_child_id, d))) then
        if free_left > 0 then
          free_left := free_left - 1;
        elsif bought > 0 then
          bought := bought - 1;
        else
          current_streak := 0;
        end if;
      end if;
    end loop;
  end if;

  freezes := free_left + bought;
  return next;
end;
$$;

-- Recomputes the child's counters from sessions, gems and history.
create function private.refresh_progress(p_child_id uuid, p_today date)
returns public.progress
language plpgsql
set search_path = ''
as $$
declare
  streak record;
  total_xp integer;
  result public.progress;
begin
  select * into streak from private.streak_state(p_child_id, p_today);
  select coalesce(sum(s.xp_awarded), 0) into total_xp
  from public.sessions s where s.child_id = p_child_id;

  insert into public.progress (
    child_id, xp, level, gems, streak_current, streak_best, streak_last_date, freezes
  )
  values (
    p_child_id,
    total_xp,
    private.level_for_xp(total_xp),
    (select coalesce(sum(g.amount), 0) from public.gem_transactions g
     where g.child_id = p_child_id),
    streak.current_streak,
    streak.best_streak,
    streak.last_kept,
    streak.freezes
  )
  on conflict (child_id) do update
    set xp = excluded.xp,
        level = excluded.level,
        gems = excluded.gems,
        streak_current = excluded.streak_current,
        streak_best = excluded.streak_best,
        streak_last_date = excluded.streak_last_date,
        freezes = excluded.freezes
    -- Parents follow this table through Realtime: an unchanged row is not written again.
    where (progress.xp, progress.level, progress.gems, progress.streak_current,
           progress.streak_best, progress.streak_last_date, progress.freezes)
      is distinct from
          (excluded.xp, excluded.level, excluded.gems, excluded.streak_current,
           excluded.streak_best, excluded.streak_last_date, excluded.freezes)
  returning * into result;
  if not found then
    select * into result from public.progress p where p.child_id = p_child_id;
  end if;
  return result;
end;
$$;

-- Awarding -----------------------------------------------------------------------------------------

-- Called by the award-session Edge Function (service role only) with the server's verdicts
-- ([{position, correct}]). Awards a finished session once; later calls return the same award.
create function public.award_session(
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
  update public.sessions s set award = result where s.id = session.id;
  return result;
end;
$$;

-- The child opens a chest won earlier: its gems join the balance.
create function public.open_chest(p_chest_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  chest public.chests;
  after public.progress;
begin
  select * into chest from public.chests c
  where c.id = p_chest_id and c.child_id in (select private.accessible_child_ids())
  for update;
  if chest.id is null then
    raise exception 'chest_not_found' using errcode = 'PT404';
  end if;

  if chest.opened_at is null then
    update public.chests c set opened_at = now() where c.id = chest.id;
    insert into public.gem_transactions (child_id, amount, reason, ref_id, local_date)
    values (chest.child_id, chest.gems, 'chest', chest.id, chest.local_date)
    on conflict do nothing;
  end if;

  after := private.refresh_progress(chest.child_id, private.child_today(chest.child_id, now()));
  return jsonb_build_object('kind', chest.kind, 'gems', chest.gems, 'total_gems', after.gems);
end;
$$;

-- A streak freeze bought with gems (FREEZE_PRICE), up to MAX_FREEZES in stock.
create function public.buy_freeze(p_child_id uuid)
returns public.progress
language plpgsql security definer
set search_path = ''
as $$
declare
  price constant integer := 30;
  max_freezes constant integer := 3;
  today date;
  current public.progress;
begin
  if p_child_id is null or p_child_id not in (select private.accessible_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  -- One purchase at a time per child.
  perform 1 from public.children c where c.id = p_child_id for update;

  today := private.child_today(p_child_id, now());
  current := private.refresh_progress(p_child_id, today);
  if current.freezes >= max_freezes then
    raise exception 'too_many_freezes' using errcode = 'PT409';
  end if;
  if current.gems < price then
    raise exception 'not_enough_gems' using errcode = 'PT409';
  end if;

  insert into public.gem_transactions (child_id, amount, reason, local_date)
  values (p_child_id, -price, 'freeze', today);
  return private.refresh_progress(p_child_id, today);
end;
$$;

-- Streaks drop when a planned day goes by: refreshed every hour, so parents see it.
create function private.refresh_all_progress(p_now timestamptz default now())
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform private.refresh_progress(p.child_id, private.child_today(p.child_id, p_now))
  from public.progress p;
end;
$$;

revoke all on function private.level_for_xp(integer) from public;
revoke all on function private.session_xp(uuid) from public;
revoke all on function private.chest_gems(uuid, public.chest_kind) from public;
revoke all on function private.child_today(uuid, timestamptz) from public;
revoke all on function private.streak_state(uuid, date) from public;
revoke all on function private.refresh_progress(uuid, date) from public;
revoke all on function private.refresh_all_progress(timestamptz) from public;

revoke all on function public.award_session(uuid, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.award_session(uuid, jsonb, timestamptz) to service_role;
revoke all on function public.open_chest(uuid) from public, anon;
revoke all on function public.buy_freeze(uuid) from public, anon;
grant execute on function public.open_chest(uuid) to authenticated;
grant execute on function public.buy_freeze(uuid) to authenticated;

select cron.schedule('refresh-progress', '5 * * * *', 'select private.refresh_all_progress()');

-- The parent's app follows streaks, levels and gems as they change (Realtime applies RLS).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.progress;
  end if;
end;
$$;
