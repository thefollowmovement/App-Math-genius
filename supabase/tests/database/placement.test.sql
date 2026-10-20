-- Placement test (phase 7): a session of kind 'placement', synced like any session with the records
-- it concludes, kept with the child's grade at the time, rewarded with XP only.
-- Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

-- Alice's family (Léa, CM1) and Léa's device.
insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', null, '{}', true);

insert into public.children (id, family_id, display_name, gender, grade)
select '00000000-0000-4000-8000-0000000000c1', p.family_id, 'Léa', 'girl', 'CM1'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';

insert into public.devices (id, user_id, family_id, platform)
select '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000d1',
  p.family_id, 'ios'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';

insert into public.device_children (device_id, child_id)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1');

-- The test as the app sends it (apps/mobile/src/data/practice/sync-engine.ts): three answers, the
-- last one « Je ne sais pas », and records for skills it asked and skills it concluded on.
create function pg_temp.placement(id uuid, kind text default 'placement') returns jsonb
language sql as $$
  select jsonb_build_object(
    'id', id, 'child_id', '00000000-0000-4000-8000-0000000000c1', 'kind', kind,
    'local_date', '2026-10-20', 'started_at', '2026-10-20T16:00:00Z',
    'completed_at', '2026-10-20T16:12:00Z', 'goal', '{"type": "count", "value": 25}'::jsonb,
    'attempts', jsonb_build_array(
      jsonb_build_object(
        'position', 0, 'skill_code', 'cm1.nombres-decimaux', 'generator_id', 'cm1.nombres-decimaux',
        'difficulty', 2, 'seed', 11, 'slot', 'current', 'twin_of', null, 'reminder', false,
        'answer', '{"type": "numeric", "text": "3,4"}'::jsonb, 'is_correct', true, 'hint_used', false,
        'time_ms', 9000, 'answered_at', '2026-10-20T16:01:00Z', 'learner_elo', 1150),
      jsonb_build_object(
        'position', 1, 'skill_code', 'ce2.tables-multiplication',
        'generator_id', 'ce2.tables-multiplication', 'difficulty', 3, 'seed', 12,
        'slot', 'current', 'twin_of', null, 'reminder', false,
        'answer', '{"type": "numeric", "text": "56"}'::jsonb, 'is_correct', true, 'hint_used', false,
        'time_ms', 7000, 'answered_at', '2026-10-20T16:02:00Z', 'learner_elo', 1450),
      jsonb_build_object(
        'position', 2, 'skill_code', 'cm1.fractions-droite-graduee',
        'generator_id', 'cm1.fractions-droite-graduee', 'difficulty', 2, 'seed', 13,
        'slot', 'current', 'twin_of', null, 'reminder', false,
        'answer', '{"type": "skipped"}'::jsonb, 'is_correct', false, 'hint_used', false,
        'time_ms', 15000, 'answered_at', '2026-10-20T16:03:00Z', 'learner_elo', 1150)
    ),
    'mastery', jsonb_build_array(
      jsonb_build_object(
        'skill_code', 'ce2.tables-multiplication', 'elo', 1460, 'mastery', 82,
        'status', 'mastered', 'attempts_count', 1, 'sessions_streak', 1,
        'mastered_at', '2026-10-20T16:12:00Z', 'last_practiced_at', '2026-10-20T16:02:00Z'),
      -- Concluded without being asked: acquired, never practised.
      jsonb_build_object(
        'skill_code', 'ce2.addition-posee', 'elo', 1450, 'mastery', 81,
        'status', 'mastered', 'attempts_count', 0, 'sessions_streak', 0,
        'mastered_at', '2026-10-20T16:12:00Z', 'last_practiced_at', null)
    )
  );
$$;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000d1", "role": "authenticated", "is_anonymous": true}', true);

select is(
  (select row(kind, grade, answered, score)::text
   from public.sync_session(pg_temp.placement('00000000-0000-4000-8000-000000000701'))),
  row('placement', 'CM1', 3, 2)::text,
  'The device records a placement test with the child''s grade'
);

select is(
  (select row(attempts_count, mastered_at, last_practiced_at)::text
   from public.child_skill_mastery
   where child_id = '00000000-0000-4000-8000-0000000000c1' and skill_code = 'ce2.addition-posee'),
  row(0, '2026-10-20T16:12:00Z'::timestamptz, null::timestamptz)::text,
  'A skill the test found acquired is stored without any practice'
);

select is(
  (select answer from public.attempts
   where session_id = '00000000-0000-4000-8000-000000000701' and position = 2),
  '{"type": "skipped"}'::jsonb,
  'A « Je ne sais pas » is stored as such, as a wrong answer'
);

-- The test is not the day's session: the parent still hears that it has not started (H + 60).
reset role;
insert into public.routines (child_id, days, start_time, deadline_time, goal_type, goal_value)
values ('00000000-0000-4000-8000-0000000000c1', '{1,2,3,4,5}', '17:00', '20:30', 'duration', 15);
select is(
  private.enqueue_reminders('2026-10-20 18:00+02'),
  1,
  'A finished placement test does not stop the reminders of the day''s session'
);
set local role authenticated;

-- Léa moves up to CM2: the test keeps the grade it was taken in.
reset role;
update public.children set grade = 'CM2' where id = '00000000-0000-4000-8000-0000000000c1';
set local role authenticated;

select is(
  (select grade from public.sessions where id = '00000000-0000-4000-8000-000000000701'),
  'CM1'::public.grade,
  'A later change of grade leaves the session''s grade'
);

select is(
  (select grade from public.sync_session(
     pg_temp.placement('00000000-0000-4000-8000-000000000702', 'bonus'))),
  'CM2'::public.grade,
  'A new session takes the new grade'
);

-- No write policy on sessions: the update finds nothing to change.
update public.sessions set grade = 'CE2' where id = '00000000-0000-4000-8000-000000000701';
select is(
  (select grade from public.sessions where id = '00000000-0000-4000-8000-000000000701'),
  'CM1'::public.grade,
  'A device cannot change a session''s grade'
);

-- The parent reads the test with its grade, to compute its result again.
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000a1", "role": "authenticated", "is_anonymous": false}', true);

select is(
  (select row(kind, grade)::text from public.sessions
   where child_id = '00000000-0000-4000-8000-0000000000c1' and kind = 'placement'),
  row('placement', 'CM1')::text,
  'The parent reads the placement test and its grade'
);

-- XP, and nothing that only the daily session earns.
reset role;
create temp table award as select public.award_session(
  '00000000-0000-4000-8000-000000000701',
  '[{"position": 0, "correct": true}, {"position": 1, "correct": true}, {"position": 2, "correct": false}]',
  '2026-10-20T16:20:00Z') as result;

select is(
  (select row((result ->> 'xp')::int, (result ->> 'gems')::int, result -> 'chest',
     (result ->> 'streak')::int)::text from award),
  row(20, 0, 'null'::jsonb, 0)::text,
  'A placement test earns XP for its right answers, no gems, chest or streak day'
);

select is(
  (select count(*)::int from public.gem_transactions
   where child_id = '00000000-0000-4000-8000-0000000000c1'),
  0,
  'No gems for a placement test'
);

select * from finish();
rollback;
