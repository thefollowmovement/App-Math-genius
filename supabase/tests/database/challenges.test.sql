-- Weekly challenges (phase 5): measured on the week's regraded sessions, paid once.
-- Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

-- Alice's family (Léa, no routine), Bob's family (Tom).
insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'bob@example.com',
   '{"display_name": "Bob", "privacy_consent_version": "2026-10"}', false);

insert into public.children (id, family_id, display_name, gender, grade)
select child.id, p.family_id, child.name, 'girl', 'CE2'
from (values
  ('00000000-0000-4000-8000-0000000000c1'::uuid, 'Léa', 'alice@example.com'),
  ('00000000-0000-4000-8000-0000000000c2'::uuid, 'Tom', 'bob@example.com')
) as child (id, name, email)
join auth.users u on u.email = child.email
join public.parents p on p.user_id = u.id;

create function pg_temp.as_user(id text) returns void
language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', id, 'role', 'authenticated', 'is_anonymous', false)::text, true);
$$;

-- A finished daily session of 10 answers on `day`, the first `right_answers` right; returns the
-- award, given in the evening (Paris time).
create function pg_temp.day(child uuid, day date, right_answers int default 9) returns jsonb
language plpgsql as $$
declare
  id uuid := gen_random_uuid();
begin
  insert into public.sessions (
    id, child_id, kind, local_date, started_at, completed_at, goal_type, goal_value, answered,
    score, duration_s, goal_met
  )
  values (
    id, child, 'daily', day, day + time '17:00', day + time '17:15', 'count', 10, 10, 10, 900, true
  );
  insert into public.attempts (
    session_id, child_id, position, skill_code, generator_id, difficulty, seed, slot, answer,
    is_correct, time_ms, answered_at, learner_elo
  )
  select id, child, i, 'ce2.tables-multiplication', 'ce2.tables-multiplication', 2, i, 'current',
    '{"type": "numeric", "text": "0"}', true, 5000, day + time '17:00' + i * interval '1 minute',
    1000
  from generate_series(0, 9) as i;
  return public.award_session(
    id,
    (select jsonb_agg(jsonb_build_object('position', i, 'correct', i < right_answers))
     from generate_series(0, 9) as i),
    (day + time '18:00') at time zone 'Europe/Paris'
  );
end;
$$;

select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.challenges'::regclass, 'public.challenge_completions'::regclass)),
  'RLS is enabled on challenges and their completions'
);

-- The same case as packages/shared/src/challenges.test.ts.
select is(
  array(select (private.challenge_of_week(week)).code from unnest(array[
    '2026-01-05', '2026-01-12', '2026-09-14', '2026-10-12', '2026-10-19', '2025-12-29'
  ]::date[]) as week),
  array['daily-5', 'correct-150', 'daily-5', 'perfect-1', 'minutes-60', 'minutes-60'],
  'Challenges take turns every week from Monday 5 January 2026'
);

-- The week of Monday 14 September: 5 daily missions.
select is(pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-09-14') -> 'challenge', null,
  'Monday: the challenge is not reached yet');
select pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-09-15');
select pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-09-16');
select pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-09-17');

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select is(
  public.weekly_challenge('00000000-0000-4000-8000-0000000000c1', '2026-09-17 19:00+02'),
  '{"code": "daily-5", "threshold": 5, "gems": 20, "week_start": "2026-09-14", "progress": 4,
    "completed": false}',
  'Thursday evening: 4 missions out of 5'
);
reset role;

create temp table friday as
  select pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-09-18') as award;
select is(
  (select award -> 'challenge' from friday),
  '{"code": "daily-5", "gems": 20}',
  'Friday: the fifth mission completes the challenge'
);
select ok(
  (select award -> 'badges' ? 'challenge-1' from friday),
  'and earns the first challenge badge'
);
select is(
  (select amount from public.gem_transactions
   where child_id = '00000000-0000-4000-8000-0000000000c1' and reason = 'challenge'),
  20,
  'Its gems are paid'
);
select is(
  (select gems from public.progress where child_id = '00000000-0000-4000-8000-0000000000c1'),
  45,
  'and counted in the balance with the 5 missions'' gems'
);
select is(pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-09-19') -> 'challenge', null,
  'Saturday: a challenge pays once a week');

set local role authenticated;
select is(
  public.weekly_challenge('00000000-0000-4000-8000-0000000000c1', '2026-09-20 10:00+02')
    -> 'completed',
  'true',
  'Sunday: the challenge shows as completed'
);
select is(
  public.weekly_challenge('00000000-0000-4000-8000-0000000000c1', '2026-09-21 10:00+02')
    - 'week_start',
  '{"code": "correct-150", "threshold": 150, "gems": 20, "progress": 0, "completed": false}',
  'Monday: a new week, a new challenge'
);
reset role;

-- The week of Monday 12 October: one perfect session; the server's grading decides.
select is(pg_temp.day('00000000-0000-4000-8000-0000000000c2', '2026-10-12', 9) -> 'challenge', null,
  'A device claiming 10 right answers out of 10 when the server finds 9 completes nothing');
select is(pg_temp.day('00000000-0000-4000-8000-0000000000c2', '2026-10-13', 10) -> 'challenge',
  '{"code": "perfect-1", "gems": 25}',
  'A perfect session completes the challenge of a perfect session');

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select is(
  (select array_agg(challenge_code) from public.challenge_completions),
  array['daily-5'],
  'Alice reads Léa''s completed challenges'
);
select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select is(
  (select array_agg(challenge_code) from public.challenge_completions),
  array['perfect-1'],
  'Bob reads Tom''s only'
);
select throws_ok(
  $$select public.weekly_challenge('00000000-0000-4000-8000-0000000000c1')$$,
  'PT404', 'child_not_found',
  'and cannot read Léa''s challenge'
);
select is((select count(*)::int from public.challenges), 6, 'Everyone signed in reads the catalog');

select * from finish();
rollback;
