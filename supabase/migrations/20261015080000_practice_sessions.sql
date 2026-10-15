-- Phase 3: skill referential, practice sessions, answers, mastery and item calibration.
--
-- A session is played on the device, offline if need be, and synced with sync_session: the device
-- sends the whole session each time (idempotent), the server recomputes score, active time and
-- whether the session counts. Mastery is computed on the device by @math-genius/exercise-engine;
-- the server keeps the most recent snapshot per skill.

create type public.skill_domain as enum ('numbers', 'measures', 'geometry', 'data');
create type public.session_kind as enum ('daily', 'bonus', 'placement', 'boss');
create type public.session_goal_type as enum ('duration', 'count');
create type public.session_slot as enum ('current', 'review', 'automatism', 'challenge');
create type public.mastery_status as enum ('to_discover', 'in_progress', 'mastered', 'to_review');

-- Tables -----------------------------------------------------------------------------------------

-- Loaded from packages/curriculum by generated migrations (*_skills.sql). Codes never change.
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]+\.[a-z0-9-]+$'),
  subject text not null default 'math',
  grade public.grade not null,
  domain public.skill_domain not null,
  title text not null,
  prerequisites text[] not null default '{}',
  automatism boolean not null default false,
  program_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Difficulty of each item (generator × difficulty), learnt from every child's answers.
create table public.item_ratings (
  id uuid primary key default gen_random_uuid(),
  generator_id text not null check (char_length(generator_id) between 1 and 80),
  difficulty smallint not null check (difficulty between 1 and 5),
  rating real not null,
  answers_count integer not null default 0 check (answers_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (generator_id, difficulty)
);

create table public.sessions (
  -- Generated on the device, so that syncing the same session twice changes nothing.
  id uuid primary key,
  child_id uuid not null references public.children (id) on delete cascade,
  device_id uuid references public.devices (id) on delete set null,
  kind public.session_kind not null,
  -- The child's calendar day where the session was played.
  local_date date not null,
  started_at timestamptz not null,
  completed_at timestamptz check (completed_at >= started_at),
  goal_type public.session_goal_type not null,
  -- Minutes or number of exercises.
  goal_value smallint not null check (goal_value between 1 and 240),
  -- Computed by sync_session from the attempts.
  answered smallint not null default 0,
  score smallint not null default 0,
  duration_s integer not null default 0,
  goal_met boolean not null default false,
  flagged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sessions_child_id_date_idx on public.sessions (child_id, local_date);

-- One answered exercise: enough to rebuild it (generator, difficulty, seed) and replay the answer.
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  position smallint not null check (position between 0 and 299),
  skill_code text not null references public.skills (code),
  generator_id text not null check (char_length(generator_id) between 1 and 80),
  difficulty smallint not null check (difficulty between 1 and 5),
  seed integer not null check (seed >= 0),
  slot public.session_slot not null,
  twin_of smallint check (twin_of >= 0 and twin_of < position),
  reminder boolean not null default false,
  answer jsonb not null,
  is_correct boolean not null,
  hint_used boolean not null default false,
  time_ms integer not null check (time_ms >= 0),
  answered_at timestamptz not null,
  -- Child's rating on the skill before answering, used to calibrate the item.
  learner_elo integer not null check (learner_elo between 0 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, position)
);
create index attempts_child_id_skill_code_idx on public.attempts (child_id, skill_code);

create table public.child_skill_mastery (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  skill_code text not null references public.skills (code),
  elo real not null check (elo between 0 and 4000),
  mastery smallint not null check (mastery between 0 and 100),
  status public.mastery_status not null,
  attempts_count integer not null check (attempts_count >= 0),
  -- Completed sessions in a row that ended at 80 or more.
  sessions_streak smallint not null check (sessions_streak >= 0),
  mastered_at timestamptz,
  last_practiced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, skill_code)
);

create trigger skills_updated_at before update on public.skills
  for each row execute function private.set_updated_at();
create trigger item_ratings_updated_at before update on public.item_ratings
  for each row execute function private.set_updated_at();
create trigger sessions_updated_at before update on public.sessions
  for each row execute function private.set_updated_at();
create trigger attempts_updated_at before update on public.attempts
  for each row execute function private.set_updated_at();
create trigger child_skill_mastery_updated_at before update on public.child_skill_mastery
  for each row execute function private.set_updated_at();

-- Access ---------------------------------------------------------------------------------------------

-- Children the caller may read and play for: their family's as a parent, their paired ones as a
-- device (none once revoked).
create function private.accessible_child_ids() returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select c.id from public.children c where c.family_id = (select private.parent_family_id())
  union
  select private.device_child_ids();
$$;

revoke all on function private.accessible_child_ids() from public;
grant execute on function private.accessible_child_ids() to authenticated;

alter table public.skills enable row level security;
alter table public.item_ratings enable row level security;
alter table public.sessions enable row level security;
alter table public.attempts enable row level security;
alter table public.child_skill_mastery enable row level security;

create policy "Signed-in users read the skills" on public.skills
  for select to authenticated
  using (true);

create policy "Signed-in users read the item ratings" on public.item_ratings
  for select to authenticated
  using (true);

create policy "Parents and devices read their children's sessions" on public.sessions
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

create policy "Parents and devices read their children's attempts" on public.attempts
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

create policy "Parents and devices read their children's mastery" on public.child_skill_mastery
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

-- Every write goes through sync_session; no insert, update or delete policy exists.

-- Sync ---------------------------------------------------------------------------------------------
-- Constants mirror packages/exercise-engine/src/adaptive (ratings.ts and session.ts).

create function private.default_item_rating(p_difficulty smallint) returns real
language sql immutable
set search_path = ''
as $$
  select (600 + 200 * p_difficulty)::real;
$$;

-- Records a session and its answers, from the first answer to the end. The device sends the whole
-- session each time; answers already stored are kept as they are.
create function public.sync_session(p_session jsonb)
returns setof public.sessions
language plpgsql security definer
set search_path = ''
as $$
declare
  min_answer_ms constant integer := 1200;
  max_gap_ms constant integer := 120000;
  item_k constant real := 4;
  v_child_id uuid := (p_session ->> 'child_id')::uuid;
  v_session_id uuid := (p_session ->> 'id')::uuid;
  caller_device uuid;
  existing_child uuid;
  new_answers jsonb;
  item record;
  stats record;
  progress real;
begin
  if v_child_id is null or v_child_id not in (select private.accessible_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  if jsonb_array_length(coalesce(p_session -> 'attempts', '[]')) > 300 then
    raise exception 'too_many_attempts' using errcode = 'PT400';
  end if;

  select s.child_id into existing_child from public.sessions s where s.id = v_session_id;
  if existing_child is not null and existing_child <> v_child_id then
    raise exception 'session_conflict' using errcode = 'PT409';
  end if;

  select d.id into caller_device
  from public.devices d
  where d.user_id = (select auth.uid()) and d.revoked_at is null;

  insert into public.sessions (
    id, child_id, device_id, kind, local_date, started_at, completed_at, goal_type, goal_value
  )
  values (
    v_session_id,
    v_child_id,
    caller_device,
    (p_session ->> 'kind')::public.session_kind,
    (p_session ->> 'local_date')::date,
    (p_session ->> 'started_at')::timestamptz,
    (p_session ->> 'completed_at')::timestamptz,
    (p_session -> 'goal' ->> 'type')::public.session_goal_type,
    (p_session -> 'goal' ->> 'value')::smallint
  )
  on conflict (id) do update
    set completed_at = coalesce(public.sessions.completed_at, excluded.completed_at);

  -- New answers only: positions already stored are left untouched.
  with inserted as (
    insert into public.attempts (
      session_id, child_id, position, skill_code, generator_id, difficulty, seed, slot, twin_of,
      reminder, answer, is_correct, hint_used, time_ms, answered_at, learner_elo
    )
    select
      v_session_id, v_child_id, a.position, a.skill_code, a.generator_id, a.difficulty, a.seed,
      a.slot, a.twin_of, a.reminder, a.answer, a.is_correct, a.hint_used, a.time_ms,
      a.answered_at, a.learner_elo
    from jsonb_to_recordset(coalesce(p_session -> 'attempts', '[]')) as a (
      position smallint, skill_code text, generator_id text, difficulty smallint, seed integer,
      slot public.session_slot, twin_of smallint, reminder boolean, answer jsonb,
      is_correct boolean, hint_used boolean, time_ms integer, answered_at timestamptz,
      learner_elo integer
    )
    on conflict (session_id, position) do nothing
    returning generator_id, difficulty, is_correct, learner_elo
  )
  select coalesce(jsonb_agg(to_jsonb(inserted)), '[]') into new_answers from inserted;

  -- Item calibration (Elo): an item gets harder when children fail it more than expected.
  for item in
    select
      n.generator_id,
      n.difficulty,
      count(*)::integer as answers,
      coalesce(r.rating, private.default_item_rating(n.difficulty)) as rating,
      sum(
        1 / (1 + power(10, (coalesce(r.rating, private.default_item_rating(n.difficulty))
          - n.learner_elo) / 400.0))
        - case when n.is_correct then 1 else 0 end
      ) as surprise
    from jsonb_to_recordset(new_answers) as n (
      generator_id text, difficulty smallint, is_correct boolean, learner_elo integer
    )
    left join public.item_ratings r
      on r.generator_id = n.generator_id and r.difficulty = n.difficulty
    group by n.generator_id, n.difficulty, r.rating
  loop
    insert into public.item_ratings (generator_id, difficulty, rating, answers_count)
    values (
      item.generator_id,
      item.difficulty,
      -- Bounded so that a few odd answers cannot move an item far from its level.
      least(private.default_item_rating(item.difficulty) + 400,
        greatest(private.default_item_rating(item.difficulty) - 400,
          item.rating + item_k * item.surprise)),
      item.answers
    )
    on conflict (generator_id, difficulty) do update
      set rating = excluded.rating,
          answers_count = public.item_ratings.answers_count + excluded.answers_count;
  end loop;

  -- Score, active time (pauses capped at 2 minutes) and whether the session counts.
  select
    count(*)::integer as answered,
    (count(*) filter (where a.is_correct))::integer as correct,
    (count(*) filter (where a.time_ms < min_answer_ms))::integer as fast,
    coalesce(sum(least(max_gap_ms, greatest(0,
      extract(epoch from (a.answered_at - greatest(s.started_at, a.previous_at))) * 1000))), 0)
      as active_ms
  into stats
  from public.sessions s
  left join (
    select
      t.answered_at, t.is_correct, t.time_ms,
      max(t.answered_at) over (order by t.position rows between unbounded preceding and 1 preceding)
        as previous_at
    from public.attempts t
    where t.session_id = v_session_id
  ) a on true
  where s.id = v_session_id
  group by s.id;

  select case s.goal_type
      when 'duration' then stats.active_ms / (s.goal_value * 60000.0)
      else (stats.answered - stats.fast)::real / s.goal_value
    end
  into progress
  from public.sessions s where s.id = v_session_id;

  update public.sessions s
  set answered = stats.answered,
      score = stats.correct,
      duration_s = round(stats.active_ms / 1000.0),
      goal_met = s.completed_at is not null and progress >= 1
        and stats.correct >= 0.6 * stats.answered,
      flagged = stats.fast >= 5 and stats.fast >= 0.3 * stats.answered
  where s.id = v_session_id;

  -- Mastery: the most recent snapshot of each skill wins (several devices may play offline).
  insert into public.child_skill_mastery (
    child_id, skill_code, elo, mastery, status, attempts_count, sessions_streak, mastered_at,
    last_practiced_at
  )
  select
    v_child_id, m.skill_code, m.elo, m.mastery, m.status, m.attempts_count, m.sessions_streak,
    m.mastered_at, m.last_practiced_at
  from jsonb_to_recordset(coalesce(p_session -> 'mastery', '[]')) as m (
    skill_code text, elo real, mastery smallint, status public.mastery_status,
    attempts_count integer, sessions_streak smallint, mastered_at timestamptz,
    last_practiced_at timestamptz
  )
  on conflict (child_id, skill_code) do update
    set elo = excluded.elo,
        mastery = excluded.mastery,
        status = excluded.status,
        attempts_count = excluded.attempts_count,
        sessions_streak = excluded.sessions_streak,
        mastered_at = excluded.mastered_at,
        last_practiced_at = excluded.last_practiced_at
    where public.child_skill_mastery.last_practiced_at is null
      or excluded.last_practiced_at >= public.child_skill_mastery.last_practiced_at;

  return query select * from public.sessions s where s.id = v_session_id;
end;
$$;

revoke all on function public.sync_session(jsonb) from public, anon;
grant execute on function public.sync_session(jsonb) to authenticated;
