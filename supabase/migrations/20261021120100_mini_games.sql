-- Phase 9b: the companion's mini-games (docs/design/mini-jeux.md).
--
-- A round is a session of kind 'game': its answers are attempts, synced by sync_session (mastery
-- and item calibration as for any session) and graded again by award-session, which gives XP per
-- right answer. The day's rounds count in its daily session for 30 % of the goal at most
-- (GAME_SHARE_PERCENT in session.ts, mirrored here). A round earns gems, 20 a day at most
-- (packages/shared/src/games.ts: change both), and neither a chest nor a streak day. The team turns
-- each game on or off in the back-office; the parent sets the daily playing time.

-- Catalog -----------------------------------------------------------------------------------------

-- Ids in packages/shared/src/games.ts (games.test.ts compares): never renamed.
create table public.mini_games (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  enabled boolean not null default true,
  position smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.mini_games (id, position) values
  ('peche-eclair', 1),
  ('pluie-de-gemmes', 2),
  ('vol-du-chaton', 3),
  ('bulles-magiques', 4),
  ('memory-du-compagnon', 5),
  ('course-des-croquettes', 6);

create trigger mini_games_updated_at before update on public.mini_games
  for each row execute function private.set_updated_at();

alter table public.mini_games enable row level security;

create policy "Signed-in users read the mini-games" on public.mini_games
  for select to authenticated
  using (true);

-- The games come from the migrations; editors only turn them on or off and order them.
create policy "Editors change the mini-games" on public.mini_games
  for update to authenticated
  using ((select private.is_admin('{editor}')))
  with check ((select private.is_admin('{editor}')));

create trigger mini_games_audit after insert or update or delete on public.mini_games
  for each row execute function private.audit_admin_change();

-- Minutes of games a day, set by the parent (who updates the child directly); 0 turns them off.
alter table public.children add column game_minutes_limit smallint not null default 20
  check (game_minutes_limit between 0 and 120);

-- A round keeps its game, its score and its stars, computed by the device: a personal record,
-- with no ranking and nothing to win. XP and gems come from the server's grading only.
alter table public.sessions
  add column game_id text references public.mini_games (id),
  add column game_score integer check (game_score between 0 and 1000000),
  add column game_stars smallint check (game_stars between 0 and 3),
  add constraint sessions_game_check check ((kind = 'game') = (game_id is not null));

create index sessions_child_id_game_idx on public.sessions (child_id, game_id)
  where game_id is not null;

-- Sync ---------------------------------------------------------------------------------------------

-- Answers, right ones, answers faster than reading allows, and active time (pauses capped at
-- 2 minutes) of a session: sessionProgress and activeMs in session.ts.
create function private.session_stats(p_session_id uuid)
returns table (answered integer, correct integer, fast integer, active_ms numeric)
language sql stable
set search_path = ''
as $$
  select
    count(a.answered_at)::integer,
    (count(*) filter (where a.is_correct))::integer,
    (count(*) filter (where a.time_ms < 1200))::integer,
    coalesce(sum(least(120000, greatest(0,
      extract(epoch from (a.answered_at - greatest(s.started_at, a.previous_at))) * 1000))), 0)
  from public.sessions s
  left join (
    select
      t.answered_at, t.is_correct, t.time_ms,
      max(t.answered_at) over (order by t.position rows between unbounded preceding and 1 preceding)
        as previous_at
    from public.attempts t
    where t.session_id = p_session_id
  ) a on true
  where s.id = p_session_id
  group by s.id;
$$;

-- As in *_practice_sessions.sql, plus a round's game, score and stars, and the share of the day's
-- rounds in a daily session's goal.
create or replace function public.sync_session(p_session jsonb)
returns setof public.sessions
language plpgsql security definer
set search_path = ''
as $$
declare
  item_k constant real := 4;
  game_share_percent constant integer := 30;
  v_child_id uuid := (p_session ->> 'child_id')::uuid;
  v_session_id uuid := (p_session ->> 'id')::uuid;
  v_kind public.session_kind := (p_session ->> 'kind')::public.session_kind;
  v_game text := p_session -> 'game' ->> 'id';
  caller_device uuid;
  existing_child uuid;
  new_answers jsonb;
  item record;
  stats record;
  games record;
  progress real;
begin
  if v_child_id is null or v_child_id not in (select private.accessible_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  if jsonb_array_length(coalesce(p_session -> 'attempts', '[]')) > 300 then
    raise exception 'too_many_attempts' using errcode = 'PT400';
  end if;
  if (v_kind = 'game') <> (v_game is not null)
    or (v_game is not null and not exists (select 1 from public.mini_games g where g.id = v_game))
  then
    raise exception 'invalid_game' using errcode = 'PT400';
  end if;

  select s.child_id into existing_child from public.sessions s where s.id = v_session_id;
  if existing_child is not null and existing_child <> v_child_id then
    raise exception 'session_conflict' using errcode = 'PT409';
  end if;

  select d.id into caller_device
  from public.devices d
  where d.user_id = (select auth.uid()) and d.revoked_at is null;

  insert into public.sessions (
    id, child_id, device_id, kind, local_date, started_at, completed_at, goal_type, goal_value,
    game_id, game_score, game_stars
  )
  values (
    v_session_id,
    v_child_id,
    caller_device,
    v_kind,
    (p_session ->> 'local_date')::date,
    (p_session ->> 'started_at')::timestamptz,
    (p_session ->> 'completed_at')::timestamptz,
    (p_session -> 'goal' ->> 'type')::public.session_goal_type,
    (p_session -> 'goal' ->> 'value')::smallint,
    v_game,
    (p_session -> 'game' ->> 'score')::integer,
    (p_session -> 'game' ->> 'stars')::smallint
  )
  on conflict (id) do update
    set completed_at = coalesce(public.sessions.completed_at, excluded.completed_at),
        game_score = greatest(public.sessions.game_score, excluded.game_score),
        game_stars = greatest(public.sessions.game_stars, excluded.game_stars);

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

  select * into stats from private.session_stats(v_session_id);

  -- The day's finished rounds, played before the daily session ends (gameCredit in session.ts).
  select coalesce(sum(g.active_ms), 0) as active_ms, coalesce(sum(g.answered - g.fast), 0) as answers
  into games
  from public.sessions s
  join public.sessions r
    on r.child_id = s.child_id and r.local_date = s.local_date and r.kind = 'game'
      and r.completed_at is not null and r.started_at < coalesce(s.completed_at, now())
  cross join lateral private.session_stats(r.id) g
  where s.id = v_session_id and s.kind = 'daily';

  select case s.goal_type
      when 'duration' then (stats.active_ms
        + least(games.active_ms, s.goal_value * 60000 * game_share_percent / 100.0))
        / (s.goal_value * 60000.0)
      else (stats.answered - stats.fast
        + least(games.answers, (s.goal_value * game_share_percent) / 100))::real / s.goal_value
    end
  into progress
  from public.sessions s where s.id = v_session_id;

  -- A round has no goal: it never counts as a validated session.
  update public.sessions s
  set answered = stats.answered,
      score = stats.correct,
      duration_s = round(stats.active_ms / 1000.0),
      goal_met = s.kind <> 'game' and s.completed_at is not null and progress >= 1
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

-- Reminders ------------------------------------------------------------------------------------

-- A round is not the day's session: as in *_placement.sql, with the games left out too. A child
-- playing a round is still in the app: no reminder to the child meanwhile.
create or replace function private.enqueue_reminders(p_now timestamptz default now())
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  step_window constant interval := interval '10 minutes';
  queued integer;
  done integer;
begin
  with today as (
    select c.id as child_id, c.family_id, c.display_name, f.timezone,
      (p_now at time zone f.timezone)::date as local_date
    from public.children c
    join public.families f on f.id = c.family_id
  ),
  planned as (
    select t.*,
      (t.local_date + p.start_time) at time zone t.timezone as start_at,
      (t.local_date + p.deadline_time) at time zone t.timezone as deadline_at
    from today t
    cross join lateral private.day_plan(t.child_id, t.local_date) p
  ),
  progress as (
    select pl.*,
      exists (
        select 1 from public.sessions s
        where s.child_id = pl.child_id and s.local_date = pl.local_date
          and s.completed_at is not null and s.kind not in ('placement', 'game')
      ) as finished,
      exists (
        select 1 from public.sessions s
        where s.child_id = pl.child_id and s.local_date = pl.local_date
          and s.kind not in ('placement', 'game')
      ) as started,
      exists (
        select 1 from public.sessions s
        where s.child_id = pl.child_id and s.local_date = pl.local_date
          and s.completed_at is null and s.updated_at > p_now - interval '10 minutes'
      ) as playing
    from planned pl
  ),
  due as (
    select pr.*, step.kind, step.audience
    from progress pr
    cross join lateral (
      values
        ('routine_soon'::public.notification_kind, 'child'::public.notification_audience,
          pr.start_at - interval '10 minutes'),
        ('routine_start', 'child', pr.start_at),
        ('routine_nudge', 'child', pr.start_at + interval '30 minutes'),
        ('not_started', 'parent', pr.start_at + interval '60 minutes'),
        ('missed', 'parent', pr.deadline_at)
    ) as step (kind, audience, due_at)
    where not pr.finished
      and p_now >= step.due_at and p_now < step.due_at + step_window
      and (step.kind = 'missed' or (step.due_at < pr.deadline_at and not pr.playing))
  )
  insert into public.notifications (
    family_id, child_id, audience, kind, dedup_key, title, body, url, created_at
  )
  select d.family_id, d.child_id, d.audience, d.kind,
    concat_ws(':', d.kind, d.child_id, d.local_date),
    content.title, content.body, private.notification_url(d.audience, d.child_id), p_now
  from due d
  cross join lateral private.notification_content(
    d.kind, d.display_name, jsonb_build_object('started', d.started)
  ) content
  on conflict (dedup_key) do nothing;
  get diagnostics queued = row_count;

  -- The parent hears when a daily session ends, with its score and active time.
  insert into public.notifications (
    family_id, child_id, audience, kind, dedup_key, title, body, url, created_at
  )
  select c.family_id, c.id, 'parent', 'session_done', concat_ws(':', 'session_done', s.id),
    content.title, content.body, private.notification_url('parent', c.id), p_now
  from public.sessions s
  join public.children c on c.id = s.child_id
  cross join lateral private.notification_content(
    'session_done', c.display_name, jsonb_build_object(
      'score', s.score, 'answered', s.answered, 'minutes', greatest(1, round(s.duration_s / 60.0))
    )
  ) content
  where s.kind = 'daily' and s.completed_at is not null
    and s.updated_at > p_now - interval '12 hours' and s.updated_at <= p_now
  on conflict (dedup_key) do nothing;
  get diagnostics done = row_count;

  return queued + done;
end;
$$;

-- Measures -------------------------------------------------------------------------------------

-- As in *_challenges.sql: the game rounds' right answers count, their minutes and perfect rounds
-- do not (a challenge is met by practising, not by playing).
create or replace function private.week_metrics(p_child_id uuid, p_week_start date) returns jsonb
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
      where s.kind <> 'game' and s.answered >= 10 and s.verified_correct = s.answered),
    'minutes', (select coalesce(sum(s.duration_s), 0) / 60 from week s where s.kind <> 'game')
  );
$$;

-- Badge measures: those of the companions migration, with the game rounds left out of what
-- counts sessions (weekend, perfect, comeback). Their right answers still count.
alter function private.badge_metrics(uuid) rename to companion_badge_metrics;

create function private.badge_metrics(p_child_id uuid) returns jsonb
language sql stable
set search_path = ''
as $$
  with awarded as (
    select s.local_date, s.answered, s.verified_correct, s.award
    from public.sessions s
    where s.child_id = p_child_id and s.awarded_at is not null and s.kind <> 'game'
  )
  select private.companion_badge_metrics(p_child_id) || jsonb_build_object(
    'weekend_sessions',
      (select count(*) from awarded s where extract(isodow from s.local_date) in (6, 7)),
    'comebacks', (select count(*) from awarded s
      where (s.award ->> 'streak')::integer = 1 and (s.award ->> 'streak_best')::integer >= 3),
    'perfect_sessions', (select count(*) from awarded s
      where s.answered >= 10 and s.verified_correct = s.answered)
  );
$$;

-- Rewards --------------------------------------------------------------------------------------

-- A round's gems: one every 3 right answers (by the server's grading, not too fast to count), 20
-- a day at most for all the rounds (gameGems in games.ts). Returns what the round earned.
create function private.settle_game(p_session public.sessions, p_now timestamptz)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  daily_cap constant integer := 20;
  answers_per_gem constant integer := 3;
  counted integer;
  earned_before integer;
  earned integer;
begin
  -- One round at a time for a child, so that two rounds awarded together keep to the cap.
  perform 1 from public.progress p where p.child_id = p_session.child_id for update;
  select count(*) into counted
  from public.attempts a
  where a.session_id = p_session.id and a.verified and a.time_ms >= 1200;
  select coalesce(sum(g.amount), 0) into earned_before
  from public.gem_transactions g
  where g.child_id = p_session.child_id and g.reason = 'game'
    and g.local_date = p_session.local_date;
  earned := greatest(0, least(counted / answers_per_gem, daily_cap - earned_before));
  if earned > 0 then
    insert into public.gem_transactions (child_id, amount, reason, ref_id, local_date)
    values (p_session.child_id, earned, 'game', p_session.id, p_session.local_date)
    on conflict do nothing;
    perform private.refresh_progress(
      p_session.child_id, private.child_today(p_session.child_id, p_now)
    );
  end if;
  return jsonb_build_object(
    'id', p_session.game_id,
    'gems', earned,
    'gems_today', earned_before + earned,
    'gems_cap', daily_cap
  );
end;
$$;

-- As in *_parent_rewards.sql, with a round's gems (before the badges, which count gems earned).
create or replace function private.award_extras(p_session public.sessions, p_now timestamptz)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  challenge jsonb := private.settle_challenge(p_session, p_now);
  boss jsonb;
  game jsonb;
  unlocked jsonb;
begin
  if p_session.kind = 'boss' then
    boss := private.settle_boss(p_session, p_now);
  end if;
  if p_session.kind = 'game' then
    game := private.settle_game(p_session, p_now);
  end if;
  unlocked := private.unlock_parent_rewards(p_session.child_id, p_now);
  -- Only what happened is told.
  return jsonb_build_object(
    'badges', to_jsonb(private.grant_badges(p_session.child_id, p_session.id, p_now))
  )
    || case when boss is null then '{}'::jsonb else jsonb_build_object('boss', boss) end
    || case when game is null then '{}'::jsonb else jsonb_build_object('game', game) end
    || case when challenge is null then '{}'::jsonb
      else jsonb_build_object('challenge', challenge) end
    || case when unlocked = '[]'::jsonb then '{}'::jsonb
      else jsonb_build_object('parent_rewards', unlocked) end;
end;
$$;

-- The game room ----------------------------------------------------------------------------------

-- Each game (on or off) with the child's record, stars and rounds played, today's playing time
-- (each round counts 4 minutes at most: GAME_ROUND_MAX_SECONDS in games.ts) against the parent's
-- limit, and today's gems from the games against their cap.
create function public.game_room(p_child_id uuid, p_now timestamptz default now())
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  today date;
begin
  if p_child_id is null or p_child_id not in (select private.accessible_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  today := private.child_today(p_child_id, p_now);
  return jsonb_build_object(
    'local_date', today,
    'limit_minutes', (select c.game_minutes_limit from public.children c where c.id = p_child_id),
    'played_s', (
      select coalesce(sum(least(240, extract(epoch from (s.completed_at - s.started_at)))), 0)
        ::integer
      from public.sessions s
      where s.child_id = p_child_id and s.kind = 'game' and s.local_date = today
        and s.completed_at is not null
    ),
    'gems_today', (
      select coalesce(sum(g.amount), 0) from public.gem_transactions g
      where g.child_id = p_child_id and g.reason = 'game' and g.local_date = today
    ),
    'games', (
      select coalesce(jsonb_agg(jsonb_build_object(
          'id', m.id,
          'enabled', m.enabled,
          'best_score', r.best_score,
          'best_stars', r.best_stars,
          'rounds', coalesce(r.rounds, 0)
        ) order by m.position), '[]'::jsonb)
      from public.mini_games m
      left join (
        select s.game_id, max(s.game_score) as best_score, max(s.game_stars) as best_stars,
          count(*) as rounds
        from public.sessions s
        where s.child_id = p_child_id and s.kind = 'game' and s.completed_at is not null
        group by s.game_id
      ) r on r.game_id = m.id
    )
  );
end;
$$;

revoke all on function private.session_stats(uuid) from public;
revoke all on function private.week_metrics(uuid, date) from public;
revoke all on function private.badge_metrics(uuid) from public;
revoke all on function private.companion_badge_metrics(uuid) from public;
revoke all on function private.settle_game(public.sessions, timestamptz) from public;
revoke all on function private.award_extras(public.sessions, timestamptz) from public;
revoke all on function public.game_room(uuid, timestamptz) from public, anon;
grant execute on function public.game_room(uuid, timestamptz) to authenticated;
