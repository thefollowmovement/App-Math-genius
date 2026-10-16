-- RLS and sync rules for sessions, attempts, mastery and item ratings. Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

-- Alice's family (Léa and Zoé), Bob's family (Tom), Léa's device and a revoked device.
insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'bob@example.com',
   '{"display_name": "Bob", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', null, '{}', true),
  ('00000000-0000-4000-8000-0000000000d2', 'authenticated', 'authenticated', null, '{}', true);

insert into public.children (id, family_id, display_name, gender, grade)
select child.id, p.family_id, child.name, 'girl', 'CE2'
from (values
  ('00000000-0000-4000-8000-0000000000c1'::uuid, 'Léa', 'alice@example.com'),
  ('00000000-0000-4000-8000-0000000000c3'::uuid, 'Zoé', 'alice@example.com'),
  ('00000000-0000-4000-8000-0000000000c2'::uuid, 'Tom', 'bob@example.com')
) as child (id, name, email)
join auth.users u on u.email = child.email
join public.parents p on p.user_id = u.id;

insert into public.devices (id, user_id, family_id, platform, revoked_at)
select device.id, device.user_id, p.family_id, 'ios', device.revoked_at
from (values
  ('00000000-0000-4000-8000-0000000000e1'::uuid, '00000000-0000-4000-8000-0000000000d1'::uuid, null::timestamptz),
  ('00000000-0000-4000-8000-0000000000e2'::uuid, '00000000-0000-4000-8000-0000000000d2'::uuid, now())
) as device (id, user_id, revoked_at)
cross join public.parents p
where p.user_id = '00000000-0000-4000-8000-0000000000a1';

insert into public.device_children (device_id, child_id)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1');

-- Payload helpers, as built by the app (apps/mobile/src/data/sync.ts).
create function pg_temp.answer(
  pos int, seconds int, correct boolean, time_ms int default 8000, difficulty int default 2
) returns jsonb language sql as $$
  select jsonb_build_object(
    'position', pos, 'skill_code', 'ce2.tables-multiplication',
    'generator_id', 'ce2.tables-multiplication', 'difficulty', difficulty, 'seed', 1000 + pos,
    'slot', 'current', 'twin_of', null, 'reminder', false,
    'answer', jsonb_build_object('type', 'numeric', 'text', '56'),
    'is_correct', correct, 'hint_used', false, 'time_ms', time_ms,
    'answered_at', '2026-10-15T17:00:00Z'::timestamptz + make_interval(secs => seconds),
    'learner_elo', 1150
  );
$$;

create function pg_temp.session(
  id uuid, answers jsonb, completed boolean, goal jsonb default '{"type": "duration", "value": 15}',
  child uuid default '00000000-0000-4000-8000-0000000000c1',
  mastery jsonb default '[]'
) returns jsonb language sql as $$
  select jsonb_build_object(
    'id', id, 'child_id', child, 'kind', 'daily', 'local_date', '2026-10-15',
    'started_at', '2026-10-15T17:00:00Z', 'completed_at',
    case when completed then '2026-10-15T17:40:00Z' end,
    'goal', goal, 'attempts', answers, 'mastery', mastery
  );
$$;

create function pg_temp.mastery(practiced text, streak int) returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object(
    'skill_code', 'ce2.tables-multiplication', 'elo', 1300, 'mastery', 63,
    'status', 'in_progress', 'attempts_count', 12, 'sessions_streak', streak,
    'mastered_at', null, 'last_practiced_at', practiced
  ));
$$;

-- First answers of the shared case in packages/exercise-engine/src/adaptive/session.test.ts.
select set_config('test.first_answers', jsonb_build_array(
  pg_temp.answer(0, 10, true), pg_temp.answer(1, 25, true),
  pg_temp.answer(2, 180, false), pg_temp.answer(3, 190, true)
)::text, true);
-- The whole session: 44 more answers every 20 seconds, 3 right out of 4.
select set_config('test.all_answers', (
  current_setting('test.first_answers')::jsonb ||
  (select jsonb_agg(pg_temp.answer(i, 190 + (i - 3) * 20, i % 4 <> 0) order by i)
   from generate_series(4, 47) as i)
)::text, true);

-- Structure -----------------------------------------------------------------------------------------

select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.skills'::regclass, 'public.item_ratings'::regclass,
     'public.sessions'::regclass, 'public.attempts'::regclass,
     'public.child_skill_mastery'::regclass)),
  'RLS is enabled on every phase 3 table'
);
select ok(
  (select count(*) >= 120 from public.skills),
  'The migrations load the skill referential'
);

-- Léa's device --------------------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000d1", "role": "authenticated", "is_anonymous": true}', true);

select ok((select count(*) >= 120 from public.skills), 'A device reads the skills');

select is(
  (select row(answered, score, duration_s, goal_met, device_id)::text
   from public.sync_session(pg_temp.session(
     '00000000-0000-4000-8000-000000000501', current_setting('test.first_answers')::jsonb, false,
     mastery => pg_temp.mastery('2026-10-15T17:03:10Z', 0)))),
  row(4, 3, 155, false, '00000000-0000-4000-8000-0000000000e1'::uuid)::text,
  'A session in progress is stored with its score and active time, pauses capped at 2 minutes'
);
select is((select count(*)::int from public.attempts), 4, 'Its answers are stored');
select is(
  (select sessions_streak from public.child_skill_mastery
   where skill_code = 'ce2.tables-multiplication'),
  0::smallint,
  'Its mastery snapshot is stored'
);
select ok(
  (select rating < 1000 and answers_count = 4 from public.item_ratings
   where generator_id = 'ce2.tables-multiplication' and difficulty = 2),
  'An item answered better than expected gets easier'
);

select set_config('test.rating',
  (select rating::text from public.item_ratings
   where generator_id = 'ce2.tables-multiplication' and difficulty = 2), true);
select lives_ok(
  $$ select public.sync_session(pg_temp.session(
       '00000000-0000-4000-8000-000000000501', current_setting('test.first_answers')::jsonb, false)) $$,
  'The same session can be sent again'
);
select is(
  (select row(count(*), min(r.answers_count), min(r.rating)::text)::text
   from public.attempts a
   cross join public.item_ratings r
   where r.generator_id = 'ce2.tables-multiplication' and r.difficulty = 2),
  row(4::bigint, 4, current_setting('test.rating'))::text,
  'Sending it again duplicates no answer and does not move the item twice'
);

select is(
  (select row(answered, score, duration_s, goal_met, flagged)::text
   from public.sync_session(pg_temp.session(
     '00000000-0000-4000-8000-000000000501', current_setting('test.all_answers')::jsonb, true,
     mastery => pg_temp.mastery('2026-10-15T17:17:50Z', 1)))),
  row(48, 36, 1035, true, false)::text,
  'A finished session of 15 active minutes at 75 % counts'
);
select is(
  (select sessions_streak from public.child_skill_mastery
   where skill_code = 'ce2.tables-multiplication'),
  1::smallint,
  'A more recent mastery snapshot replaces the stored one'
);
select lives_ok(
  $$ select public.sync_session(pg_temp.session(
       '00000000-0000-4000-8000-000000000502', '[]', false,
       mastery => pg_temp.mastery('2026-10-14T17:00:00Z', 5))) $$,
  'A session synced late from another device is accepted'
);
select is(
  (select sessions_streak from public.child_skill_mastery
   where skill_code = 'ce2.tables-multiplication'),
  1::smallint,
  'An older mastery snapshot does not replace a newer one'
);

select is(
  (select goal_met from public.sync_session(pg_temp.session(
     '00000000-0000-4000-8000-000000000503',
     (select jsonb_agg(pg_temp.answer(i, i * 20, i % 2 = 0) order by i)
      from generate_series(0, 49) as i),
     true))),
  false,
  'A session below 60 % success does not count'
);
select is(
  (select row(goal_met, flagged)::text from public.sync_session(pg_temp.session(
     '00000000-0000-4000-8000-000000000504',
     (select jsonb_agg(pg_temp.answer(i, i * 3, true, case when i < 6 then 500 else 4000 end)
        order by i)
      from generate_series(0, 9) as i),
     true, '{"type": "count", "value": 5}'))),
  row(false, true)::text,
  'Answers faster than 1.2 s do not count toward the goal, and many of them flag the session'
);
select is(
  (select goal_met from public.sync_session(pg_temp.session(
     '00000000-0000-4000-8000-000000000505',
     (select jsonb_agg(pg_temp.answer(i, i * 10, false, 6000, 1) order by i)
      from generate_series(0, 2) as i) ||
     (select jsonb_agg(pg_temp.answer(i, i * 10, true) order by i)
      from generate_series(3, 7) as i),
     true, '{"type": "count", "value": 8}'))),
  true,
  'A count goal is met with enough answers at 60 % or more'
);
select ok(
  (select rating > 800 from public.item_ratings
   where generator_id = 'ce2.tables-multiplication' and difficulty = 1),
  'An item failed more than expected gets harder'
);

select throws_ok(
  $$ insert into public.sessions (id, child_id, kind, local_date, started_at, goal_type, goal_value)
     values (gen_random_uuid(), '00000000-0000-4000-8000-0000000000c1', 'daily', '2026-10-15',
       now(), 'count', 10) $$,
  '42501',
  null,
  'A device cannot write sessions directly'
);
update public.child_skill_mastery set mastery = 100;
select is(
  (select mastery from public.child_skill_mastery where skill_code = 'ce2.tables-multiplication'),
  63::smallint,
  'A device cannot write mastery directly'
);
select throws_ok(
  $$ select public.sync_session(pg_temp.session(
       '00000000-0000-4000-8000-000000000506', '[]', false,
       child => '00000000-0000-4000-8000-0000000000c3')) $$,
  'PT404',
  'child_not_found',
  'A device cannot sync for a child it is not paired with'
);
select throws_ok(
  $$ select public.sync_session(pg_temp.session(
       '00000000-0000-4000-8000-000000000507',
       (select jsonb_agg(pg_temp.answer(i, i, true)) from generate_series(0, 300) as i),
       false)) $$,
  'PT400',
  'too_many_attempts',
  'A session holds at most 300 answers'
);

-- Alice, parent of Léa and Zoé --------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000a1", "role": "authenticated", "is_anonymous": false}', true);

select is(
  (select count(*)::int from public.sessions where child_id = '00000000-0000-4000-8000-0000000000c1'),
  5,
  'A parent reads their child''s sessions'
);
select is((select count(*)::int from public.attempts), 48 + 50 + 10 + 8, 'A parent reads the answers');
select is(
  (select device_id from public.sync_session(pg_temp.session(
     '00000000-0000-4000-8000-000000000508', '[]', false,
     child => '00000000-0000-4000-8000-0000000000c3'))),
  null,
  'A parent can play a session for their child on their own phone'
);
select throws_ok(
  $$ select public.sync_session(pg_temp.session(
       '00000000-0000-4000-8000-000000000501', '[]', false,
       child => '00000000-0000-4000-8000-0000000000c3')) $$,
  'PT409',
  'session_conflict',
  'A session cannot move to another child'
);

-- Bob, another family -----------------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000b1", "role": "authenticated", "is_anonymous": false}', true);

select is((select count(*)::int from public.sessions), 0, 'Another family reads no session');
select is((select count(*)::int from public.attempts), 0, 'Another family reads no answer');
select is((select count(*)::int from public.child_skill_mastery), 0, 'Another family reads no mastery');
select throws_ok(
  $$ select public.sync_session(pg_temp.session('00000000-0000-4000-8000-000000000509', '[]', false)) $$,
  'PT404',
  'child_not_found',
  'Another family cannot sync for the child'
);

-- Revoked device ----------------------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000d2", "role": "authenticated", "is_anonymous": true}', true);

select is((select count(*)::int from public.sessions), 0, 'A revoked device reads no session');
select throws_ok(
  $$ select public.sync_session(pg_temp.session('00000000-0000-4000-8000-000000000510', '[]', false)) $$,
  'PT404',
  'child_not_found',
  'A revoked device cannot sync'
);

-- Anonymous visitors ------------------------------------------------------------------------------------

reset role;
set local role anon;
select throws_ok(
  $$ select public.sync_session('{}') $$,
  '42501',
  null,
  'Visitors without a session cannot sync'
);
select is((select count(*)::int from public.skills), 0, 'Visitors without a session read no skill');

select * from finish();
rollback;
