-- Rewards from regraded answers: XP, gems, streak, freezes and chests (phase 5), on simulated
-- days. Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(36);

-- Alice's family (Léa with a Monday-to-Friday routine, Zoé without one), Bob's family (Tom),
-- Léa's device.
insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'bob@example.com',
   '{"display_name": "Bob", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', null, '{}', true);

insert into public.children (id, family_id, display_name, gender, grade)
select child.id, p.family_id, child.name, 'girl', 'CE2'
from (values
  ('00000000-0000-4000-8000-0000000000c1'::uuid, 'Léa', 'alice@example.com'),
  ('00000000-0000-4000-8000-0000000000c3'::uuid, 'Zoé', 'alice@example.com'),
  ('00000000-0000-4000-8000-0000000000c2'::uuid, 'Tom', 'bob@example.com')
) as child (id, name, email)
join auth.users u on u.email = child.email
join public.parents p on p.user_id = u.id;

insert into public.devices (id, user_id, family_id, platform)
select '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000d1',
  p.family_id, 'ios'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';
insert into public.device_children (device_id, child_id)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1');

insert into public.routines (child_id, days, start_time, deadline_time, goal_type, goal_value)
values ('00000000-0000-4000-8000-0000000000c1', '{1,2,3,4,5}', '17:00', '20:30', 'duration', 15);

create function pg_temp.as_user(id text, anonymous boolean default false) returns void
language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', id, 'role', 'authenticated', 'is_anonymous', anonymous)::text, true);
$$;

-- A finished session on `day`, the device saying `claimed` of `total` answers were right.
create function pg_temp.play(
  child uuid, day date, claimed int, total int default 10, kind text default 'daily',
  time_ms int default 5000
) returns uuid language plpgsql as $$
declare
  id uuid := gen_random_uuid();
begin
  insert into public.sessions (
    id, child_id, kind, local_date, started_at, completed_at, goal_type, goal_value, answered,
    score, duration_s, goal_met
  )
  values (
    id, child, kind::public.session_kind, day, day + time '17:00', day + time '17:20',
    'duration', 15, total, claimed, 900, claimed >= 0.6 * total
  );
  insert into public.attempts (
    session_id, child_id, position, skill_code, generator_id, difficulty, seed, slot, answer,
    is_correct, time_ms, answered_at, learner_elo
  )
  select id, child, i, 'ce2.tables-multiplication', 'ce2.tables-multiplication', 2, i, 'current',
    '{"type": "numeric", "text": "0"}', i < claimed, time_ms, day + time '17:00' + i * interval '1 minute',
    1000
  from generate_series(0, total - 1) as i;
  return id;
end;
$$;

-- The server's verdicts: the first `right` answers are right.
create function pg_temp.verdicts(right_answers int, total int default 10) returns jsonb
language sql as $$
  select jsonb_agg(jsonb_build_object('position', i, 'correct', i < right_answers) order by i)
  from generate_series(0, total - 1) as i;
$$;

-- Plays a day and awards it in the evening, Paris time; returns the award.
create function pg_temp.day(child uuid, day date, right_answers int default 10) returns jsonb
language sql as $$
  select public.award_session(
    pg_temp.play(child, day, right_answers), pg_temp.verdicts(right_answers),
    (day + time '18:00') at time zone 'Europe/Paris'
  );
$$;

select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.progress'::regclass, 'public.gem_transactions'::regclass,
     'public.chests'::regclass)),
  'RLS is enabled on progress, gems and chests'
);
select is(
  (select schedule from cron.job where jobname = 'refresh-progress'),
  '5 * * * *',
  'Streaks are refreshed every hour'
);
select is(
  (select array_agg(private.level_for_xp(xp)) from unnest('{0,99,100,299,300,999,1000,4500}'::int[]) as xp),
  '{1,1,2,2,3,4,5,10}'::smallint[],
  'Levels follow the thresholds of packages/shared/src/rewards.ts'
);

-- XP and the server's grading ----------------------------------------------------------------

select is(
  (public.award_session(
    pg_temp.play('00000000-0000-4000-8000-0000000000c2', '2026-10-05', 7, kind => 'bonus'),
    pg_temp.verdicts(7), '2026-10-05 18:00+02') ->> 'xp')::int,
  80,
  '10 XP per right answer and 10 more for 5 in a row'
);
select is(
  (public.award_session(
    pg_temp.play('00000000-0000-4000-8000-0000000000c2', '2026-10-06', 10, kind => 'bonus'),
    pg_temp.verdicts(4), '2026-10-06 18:00+02') - 'session_id' - 'chest' - 'badges'),
  jsonb_build_object(
    'xp', 40, 'verified_correct', 4, 'answered', 10, 'goal_met', false, 'gems', 0,
    'level', 2, 'level_before', 1, 'xp_total', 120, 'streak', 0, 'streak_before', 0,
    'streak_best', 0),
  'The server''s grading wins over the device''s: the session is no longer validated'
);
select is(
  (public.award_session(
    pg_temp.play('00000000-0000-4000-8000-0000000000c2', '2026-10-07', 10, kind => 'bonus',
      time_ms => 800),
    pg_temp.verdicts(10), '2026-10-07 18:00+02') ->> 'xp')::int,
  0,
  'Answers too fast to be read earn nothing'
);
select is(
  (select array_agg(a.verified order by a.position) from public.attempts a
   join public.sessions s on s.id = a.session_id
   where s.local_date = '2026-10-06' and a.position < 6),
  '{t,t,t,t,f,f}'::boolean[],
  'Each answer keeps the server''s verdict'
);

select pg_temp.play('00000000-0000-4000-8000-0000000000c2', '2026-10-08', 10) as tom_session \gset
update public.sessions set completed_at = null where id = :'tom_session';
select throws_ok(
  format('select public.award_session(%L, %L)', :'tom_session', pg_temp.verdicts(10)),
  'PT409', 'session_not_completed',
  'An unfinished session earns nothing yet'
);

-- Seven days in a row (Zoé, no routine) ----------------------------------------------------------

create temporary table week as
select day::date, pg_temp.day('00000000-0000-4000-8000-0000000000c3', day::date) as award
from generate_series('2026-10-12'::date, '2026-10-18'::date, interval '1 day') as day;

select is(
  (select array_agg((award ->> 'streak')::int order by day) from week),
  '{1,2,3,4,5,6,7}'::int[],
  'The streak grows by one each day'
);
select is(
  (select array_agg(award -> 'chest' ->> 'kind' order by day) from week),
  '{common,common,common,common,common,common,rare}'::text[],
  'Each day brings a chest, a rare one on the seventh'
);
select ok(
  (select bool_and(c.gems between 5 and 15) from public.chests c
   where c.child_id = '00000000-0000-4000-8000-0000000000c3' and c.kind = 'common')
  and (select c.gems between 25 and 50 from public.chests c
       where c.child_id = '00000000-0000-4000-8000-0000000000c3' and c.kind = 'rare'),
  'Common chests hold 5 to 15 gems, rare ones 25 to 50'
);
select is(
  (select row(xp, level, gems, streak_current, streak_best, freezes)::text from public.progress
   where child_id = '00000000-0000-4000-8000-0000000000c3'),
  -- Gems: 5 per validated session, and 25 for the week's challenge (a perfect session,
  -- challenges.test.sql).
  row(7 * 120, 4, 7 * 5 + 25, 7, 7, 1)::text,
  'Progress adds up the week: XP, level, the gems of validated sessions, streak and freeze'
);

select is(
  public.award_session((select (award ->> 'session_id')::uuid from week where day = '2026-10-18'),
    pg_temp.verdicts(0)),
  (select award from week where day = '2026-10-18'),
  'Awarding a session again returns the same award'
);
select is(
  (select count(*)::int from public.gem_transactions
   where child_id = '00000000-0000-4000-8000-0000000000c3'),
  8,
  'and pays nothing twice (7 sessions and the week''s challenge)'
);

-- A routine, a freeze, holidays and a session synced late (Léa) ------------------------------------

select pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-10-12');
select pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-10-13');
-- Wednesday 14 is missed: the week's free freeze covers it.
select is(
  (pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-10-15') ->> 'streak')::int,
  3,
  'A missed day is covered by the week''s free freeze'
);
select is(
  (select freezes from public.progress where child_id = '00000000-0000-4000-8000-0000000000c1'),
  0::smallint,
  'which is then used up'
);
-- Friday 16 is missed with no freeze left; the weekend is not planned.
select is(
  (pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-10-19') ->> 'streak')::int,
  1,
  'A second missed day breaks the streak; days off are ignored'
);
select is(
  (select row(streak_best, freezes)::text from public.progress
   where child_id = '00000000-0000-4000-8000-0000000000c1'),
  row(3, 1)::text,
  'The best streak is kept and the free freeze comes back on Monday'
);

insert into public.vacations (child_id, from_date, to_date)
values ('00000000-0000-4000-8000-0000000000c1', '2026-10-20', '2026-10-21');
-- Thursday 22 is played offline and synced after Friday 23.
select pg_temp.play('00000000-0000-4000-8000-0000000000c1', '2026-10-22', 10) as thursday \gset
select is(
  (pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-10-23') ->> 'streak')::int,
  2,
  'Holidays are ignored; Thursday, not synced yet, takes the freeze'
);
select is(
  (public.award_session(:'thursday', pg_temp.verdicts(10), '2026-10-23 19:00+02') ->> 'streak')::int,
  3,
  'Once synced, Thursday counts on its own day'
);
select is(
  (select row(streak_current, freezes)::text from public.progress
   where child_id = '00000000-0000-4000-8000-0000000000c1'),
  row(3, 1)::text,
  'and the freeze is given back'
);

select private.refresh_all_progress('2026-10-27 08:00+01');
select is(
  (select row(streak_current, freezes)::text from public.progress
   where child_id = '00000000-0000-4000-8000-0000000000c1'),
  row(3, 0)::text,
  'The hourly refresh spends a freeze on a missed Monday'
);
select private.refresh_all_progress('2026-10-28 08:00+01');
select is(
  (select streak_current from public.progress
   where child_id = '00000000-0000-4000-8000-0000000000c1'),
  0::smallint,
  'and breaks the streak on the next missed day'
);
create temp table progress_row as
  select ctid as row_version from public.progress
  where child_id = '00000000-0000-4000-8000-0000000000c1';
select private.refresh_all_progress('2026-10-28 09:00+01');
select is(
  (select ctid from public.progress where child_id = '00000000-0000-4000-8000-0000000000c1'),
  (select row_version from progress_row),
  'An unchanged progress row is not written again (parents follow it through Realtime)'
);
select ok(
  exists (select 1 from pg_publication_tables
          where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'progress'),
  'Progress is published to Realtime'
);

-- Chests and freezes, as the family ------------------------------------------------------------

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');

select is(
  (public.open_chest((select c.id from public.chests c
    where c.child_id = '00000000-0000-4000-8000-0000000000c3' and c.kind = 'rare')) ->> 'total_gems')::int,
  35 + 25 + (select c.gems from public.chests c
        where c.child_id = '00000000-0000-4000-8000-0000000000c3' and c.kind = 'rare'),
  'Opening a chest adds its gems'
);
select is(
  (public.open_chest((select c.id from public.chests c
    where c.child_id = '00000000-0000-4000-8000-0000000000c3' and c.kind = 'rare')) ->> 'total_gems')::int,
  (select gems from public.progress where child_id = '00000000-0000-4000-8000-0000000000c3'),
  'A chest pays once'
);
select is(
  (public.buy_freeze('00000000-0000-4000-8000-0000000000c3')).freezes,
  2::smallint,
  'Gems buy a freeze'
);
select public.buy_freeze('00000000-0000-4000-8000-0000000000c3');
select throws_ok(
  $$ select public.buy_freeze('00000000-0000-4000-8000-0000000000c3') $$,
  'PT409', 'too_many_freezes',
  'Three freezes at most'
);
select is(
  (public.buy_freeze('00000000-0000-4000-8000-0000000000c1')).gems,
  -- 6 validated sessions and the challenge of the week of 12 October (a perfect session).
  6 * 5 + 25 - 30,
  'A freeze costs 30 gems'
);
select throws_ok(
  $$ select public.buy_freeze('00000000-0000-4000-8000-0000000000c1') $$,
  'PT409', 'not_enough_gems',
  'and cannot be bought without them'
);
select throws_ok(
  format('select public.award_session(%L, %L)', :'tom_session', pg_temp.verdicts(10)),
  '42501', null,
  'Only the server awards sessions'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select is(
  (select count(*)::int from public.progress) + (select count(*)::int from public.chests)
  + (select count(*)::int from public.gem_transactions where child_id <> '00000000-0000-4000-8000-0000000000c2'),
  1 + 0,
  'A parent reads their own children''s rewards only'
);
select throws_ok(
  format('select public.open_chest(%L)', (select id from public.chests limit 1)),
  'PT404', 'chest_not_found',
  'nor opens another family''s chests'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select is(
  (select array_agg(child_id) from public.progress),
  '{00000000-0000-4000-8000-0000000000c1}'::uuid[],
  'A device reads its own child''s progress'
);
select throws_ok(
  $$ select public.buy_freeze('00000000-0000-4000-8000-0000000000c3') $$,
  'PT404', 'child_not_found',
  'and spends no other child''s gems'
);

select * from finish();
rollback;
