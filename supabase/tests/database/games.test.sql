-- Mini-games (phase 9b): the catalog the team turns on and off, a round synced as a session of
-- kind 'game', its share of the daily session, its gems capped per day, the game room and the
-- parent's daily limit. Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

-- Eva (editor), Alice's family (Léa, CM1, Paris time) and Léa's device.
insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000f2', 'authenticated', 'authenticated', 'eva@team.example', '{}', false),
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', null, '{}', true);
select private.grant_admin('eva@team.example', 'editor');

insert into public.children (id, family_id, display_name, gender, grade)
select '00000000-0000-4000-8000-0000000000c1', p.family_id, 'Léa', 'girl', 'CM1'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';
update public.families set timezone = 'Europe/Paris';
insert into public.devices (id, user_id, family_id, platform)
select '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000d1',
  p.family_id, 'ios'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';
insert into public.device_children (device_id, child_id)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1');

-- A session as the app sends it (sync-engine.ts): `count` answers, one every `every` seconds from
-- `started`, each taking `ms` (the third one `third_ms`).
create function pg_temp.session(
  id uuid, kind text, started timestamptz, count int, every int default 30, ms int default 3000,
  third_ms int default null, goal jsonb default '{"type": "duration", "value": 15}',
  game jsonb default null
) returns jsonb
language sql as $$
  select jsonb_build_object(
    'id', id, 'child_id', '00000000-0000-4000-8000-0000000000c1', 'kind', kind,
    'local_date', (started at time zone 'Europe/Paris')::date, 'started_at', started,
    'completed_at', started + (count * every + 5) * interval '1 second', 'goal', goal,
    'game', game,
    'attempts', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'position', i, 'skill_code', 'ce2.tables-multiplication',
        'generator_id', 'ce2.tables-multiplication', 'difficulty', 2, 'seed', 100 + i,
        'slot', 'automatism', 'twin_of', null, 'reminder', false,
        'answer', '{"type": "numeric", "text": "56"}'::jsonb, 'is_correct', true,
        'hint_used', false,
        'time_ms', case when i = 2 and third_ms is not null then third_ms else ms end,
        'answered_at', started + (i + 1) * every * interval '1 second', 'learner_elo', 1100
      ) order by i), '[]'::jsonb)
      from generate_series(0, count - 1) as i
    ),
    'mastery', jsonb_build_array(jsonb_build_object(
      'skill_code', 'ce2.tables-multiplication', 'elo', 1120, 'mastery', 40,
      'status', 'in_progress', 'attempts_count', count, 'sessions_streak', 0,
      'mastered_at', null, 'last_practiced_at', started + count * every * interval '1 second'))
  );
$$;

create function pg_temp.verdicts(total int) returns jsonb
language sql as $$
  select jsonb_agg(jsonb_build_object('position', i, 'correct', true) order by i)
  from generate_series(0, total - 1) as i;
$$;

select ok(
  (select relrowsecurity from pg_class where oid = 'public.mini_games'::regclass),
  'RLS is enabled on the mini-games'
);
select is(
  (select array_agg(id order by position) from public.mini_games),
  '{peche-eclair,pluie-de-gemmes,vol-du-chaton,bulles-magiques,memory-du-compagnon,course-des-croquettes}'::text[],
  'The six games of docs/design/mini-jeux.md, in order'
);

-- The device ------------------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000d1", "role": "authenticated", "is_anonymous": true}', true);

select is(
  (select count(*)::int from public.mini_games where enabled),
  6,
  'The device reads the games'
);
update public.mini_games set enabled = false where id = 'peche-eclair';
select is(
  (select enabled from public.mini_games where id = 'peche-eclair'),
  true,
  'The device cannot turn a game off'
);

-- Same case as session.test.ts: a 5-minute round before the daily session, 4 of its 5 answers
-- slow enough to count.
select is(
  (select row(kind, game_id, game_score, game_stars, answered, score, duration_s, goal_met)::text
   from public.sync_session(pg_temp.session(
     '00000000-0000-4000-8000-000000000901', 'game', '2026-10-15 16:30+00', 5, every => 60,
     third_ms => 800, goal => '{"type": "duration", "value": 3}',
     game => '{"id": "pluie-de-gemmes", "score": 640, "stars": 2}'))),
  row('game', 'pluie-de-gemmes', 640, 2, 5, 5, 300, false)::text,
  'A round is a session of kind game, with its score and stars, never validated'
);
select is(
  (select count(*)::int from public.attempts where session_id = '00000000-0000-4000-8000-000000000901'),
  5,
  'Its answers are stored like a session''s'
);
select is(
  (select elo from public.child_skill_mastery
   where child_id = '00000000-0000-4000-8000-0000000000c1' and skill_code = 'ce2.tables-multiplication'),
  1120::real,
  'Its answers update the mastery'
);
select throws_ok(
  format('select public.sync_session(%L)', pg_temp.session(
    '00000000-0000-4000-8000-000000000902', 'game', '2026-10-15 16:40+00', 2)),
  'PT400', 'invalid_game',
  'A round names its game'
);
select throws_ok(
  format('select public.sync_session(%L)', pg_temp.session(
    '00000000-0000-4000-8000-000000000902', 'game', '2026-10-15 16:40+00', 2,
    game => '{"id": "tetris", "score": 1, "stars": 0}')),
  'PT400', 'invalid_game',
  'A round of an unknown game is refused'
);
select throws_ok(
  format('select public.sync_session(%L)', pg_temp.session(
    '00000000-0000-4000-8000-000000000902', 'daily', '2026-10-15 16:40+00', 2,
    game => '{"id": "vol-du-chaton", "score": 1, "stars": 0}')),
  'PT400', 'invalid_game',
  'Only a round has a game'
);

-- The daily session: 10 min 30 s of its own and 4 min 30 s of games make its 15 minutes.
select is(
  (select goal_met from public.sync_session(pg_temp.session(
    '00000000-0000-4000-8000-000000000911', 'daily', '2026-10-15 17:00+00', 21))),
  true,
  'The day''s rounds count in its daily session, for 30 % of the goal at most'
);
select is(
  (select goal_met from public.sync_session(pg_temp.session(
    '00000000-0000-4000-8000-000000000912', 'daily', '2026-10-15 17:30+00', 20))),
  false,
  'A minute short is not enough'
);
select is(
  (select goal_met from public.sync_session(pg_temp.session(
    '00000000-0000-4000-8000-000000000913', 'daily', '2026-10-15 18:00+00', 7,
    goal => '{"type": "count", "value": 10}'))),
  true,
  'Toward a count goal, 3 of 10 exercises at most come from the rounds'
);
select is(
  (select goal_met from public.sync_session(pg_temp.session(
    '00000000-0000-4000-8000-000000000914', 'daily', '2026-10-16 17:00+00', 21))),
  false,
  'Rounds of another day do not count'
);

-- Gems ---------------------------------------------------------------------------------------

-- Same case as games.test.ts: 1 gem, then 10, then 9 to reach the cap of 20, then none.
select public.sync_session(pg_temp.session(
  ('00000000-0000-4000-8000-00000000092' || r)::uuid, 'game', '2026-10-15 19:00+00'::timestamptz + r * interval '5 minutes',
  case r when 3 then 9 else 30 end, every => 5,
  goal => '{"type": "duration", "value": 3}',
  game => jsonb_build_object('id', 'vol-du-chaton', 'score', 100 * r, 'stars', 3)))
from generate_series(1, 3) as r;

reset role;
select is(
  (select array_agg((public.award_session(id, pg_temp.verdicts(n), '2026-10-15 22:00+02') -> 'game' ->> 'gems')::int
     order by k)
   from (values
     (1, '00000000-0000-4000-8000-000000000901'::uuid, 5),
     (2, '00000000-0000-4000-8000-000000000921'::uuid, 30),
     (3, '00000000-0000-4000-8000-000000000922'::uuid, 30),
     (4, '00000000-0000-4000-8000-000000000923'::uuid, 9)
   ) as rounds (k, id, n)),
  '{1,10,9,0}'::int[],
  'One gem every 3 right answers, 20 a day at most'
);
select is(
  (select award - 'session_id' - 'badges' - 'level' - 'level_before' - 'xp_total' - 'streak'
     - 'streak_before' - 'streak_best'
   from public.sessions where id = '00000000-0000-4000-8000-000000000901'),
  jsonb_build_object(
    'xp', 40, 'verified_correct', 5, 'answered', 5, 'goal_met', false, 'gems', 0, 'chest', null,
    'game', jsonb_build_object('id', 'pluie-de-gemmes', 'gems', 1, 'gems_today', 1, 'gems_cap', 20)),
  'A round earns XP for its right answers and its gems, no chest'
);
select is(
  (select p.gems - (select coalesce(sum(g.amount), 0) from public.gem_transactions g
     where g.child_id = p.child_id and g.reason <> 'game')
   from public.progress p where p.child_id = '00000000-0000-4000-8000-0000000000c1')::int,
  20,
  'The games'' gems reach the balance'
);
select is(
  (private.badge_metrics('00000000-0000-4000-8000-0000000000c1') ->> 'perfect_sessions')::int,
  0,
  'A perfect round is not a perfect session'
);
select is(
  (private.week_metrics('00000000-0000-4000-8000-0000000000c1', '2026-10-12') ->> 'minutes')::int,
  0,
  'The rounds'' minutes do not count toward a challenge'
);

-- The game room --------------------------------------------------------------------------------

set local role authenticated;
select is(
  (select public.game_room('00000000-0000-4000-8000-0000000000c1', '2026-10-15 22:00+02')
     - 'games'),
  jsonb_build_object('local_date', '2026-10-15', 'limit_minutes', 20,
    'played_s', 240 + 155 + 155 + 50, 'gems_today', 20),
  'The game room tells today''s playing time (4 minutes a round at most) and gems'
);
select is(
  (select g from jsonb_array_elements(public.game_room('00000000-0000-4000-8000-0000000000c1')
     -> 'games') g where g ->> 'id' = 'vol-du-chaton'),
  jsonb_build_object('id', 'vol-du-chaton', 'enabled', true, 'best_score', 300, 'best_stars', 3,
    'rounds', 3),
  'Each game comes with the child''s record, stars and rounds'
);

-- The editor turns a game off; the change is logged ------------------------------------------

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000f2", "role": "authenticated", "is_anonymous": false}', true);
update public.mini_games set enabled = false where id = 'peche-eclair';
reset role;
select is(
  (select row(enabled)::text from public.mini_games where id = 'peche-eclair'),
  row(false)::text,
  'An editor turns a game off'
);
select is(
  (select row(entity, entity_id, action, after ->> 'enabled')::text from public.admin_audit_log
   where entity = 'mini_games'),
  row('mini_games', 'peche-eclair', 'update', 'false')::text,
  'The change is in the log'
);

-- The parent's daily limit -----------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000d1", "role": "authenticated", "is_anonymous": true}', true);
update public.children set game_minutes_limit = 120;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000a1", "role": "authenticated", "is_anonymous": false}', true);
select is(
  (select game_minutes_limit from public.children where id = '00000000-0000-4000-8000-0000000000c1'),
  20::smallint,
  'The device cannot change the limit'
);
update public.children set game_minutes_limit = 30 where id = '00000000-0000-4000-8000-0000000000c1';
select is(
  (select game_minutes_limit from public.children where id = '00000000-0000-4000-8000-0000000000c1'),
  30::smallint,
  'The parent sets the daily playing time'
);
select throws_ok(
  $$update public.children set game_minutes_limit = 500$$,
  '23514', null,
  'The limit stays within 2 hours'
);

-- A round is not the day's session: the parent still hears that it has not started (H + 60).
reset role;
insert into public.routines (child_id, days, start_time, deadline_time, goal_type, goal_value)
values ('00000000-0000-4000-8000-0000000000c1', '{1,2,3,4,5,6,7}', '17:00', '20:30', 'duration', 15);
select public.sync_session(pg_temp.session(
  '00000000-0000-4000-8000-000000000931', 'game', '2026-10-19 16:00+02', 5,
  goal => '{"type": "duration", "value": 3}',
  game => '{"id": "bulles-magiques", "score": 50, "stars": 1}'));
select is(
  private.enqueue_reminders('2026-10-19 18:00+02'),
  1,
  'A round does not stop the reminders of the day''s session'
);

select * from finish();
rollback;
