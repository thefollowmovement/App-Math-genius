-- Badges (phase 5): granted by award_session from the server's own data, on simulated days.
-- Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- Alice's family (Léa, no routine: every day is planned), Bob's family (Tom), Léa's device.
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

create function pg_temp.as_user(id text, anonymous boolean default false) returns void
language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', id, 'role', 'authenticated', 'is_anonymous', anonymous)::text, true);
$$;

-- A finished session of 10 answers on `day`, all of them right according to the device.
create function pg_temp.play(
  child uuid, day date, kind text default 'daily', time_ms int default 5000
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
    'duration', 15, 10, 10, 900, true
  );
  insert into public.attempts (
    session_id, child_id, position, skill_code, generator_id, difficulty, seed, slot, answer,
    is_correct, time_ms, answered_at, learner_elo
  )
  select id, child, i, 'ce2.tables-multiplication', 'ce2.tables-multiplication', 2, i, 'current',
    '{"type": "numeric", "text": "0"}', true, time_ms, day + time '17:00' + i * interval '1 minute',
    1000
  from generate_series(0, 9) as i;
  return id;
end;
$$;

-- The server's verdicts: the first `right_answers` of 10 are right.
create function pg_temp.verdicts(right_answers int) returns jsonb
language sql as $$
  select jsonb_agg(jsonb_build_object('position', i, 'correct', i < right_answers) order by i)
  from generate_series(0, 9) as i;
$$;

-- Plays a day and awards it in the evening, Paris time; returns the new badges.
create function pg_temp.day(
  child uuid, day date, right_answers int default 9, kind text default 'daily',
  time_ms int default 5000
) returns jsonb
language sql as $$
  select public.award_session(
    pg_temp.play(child, day, kind, time_ms), pg_temp.verdicts(right_answers),
    (day + time '18:00') at time zone 'Europe/Paris'
  ) -> 'badges';
$$;

-- Catalog ----------------------------------------------------------------------------------------

select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.badges'::regclass, 'public.child_badges'::regclass)),
  'RLS is enabled on badges and child badges'
);
select is((select count(*)::int from public.badges), 37, 'The catalog holds 37 badges');
select ok(
  (select bool_and(private.badge_metrics('00000000-0000-4000-8000-0000000000c1') ? b.metric)
   from public.badges b),
  'Every badge asks for a measure the server computes'
);

-- A week of sessions -------------------------------------------------------------------------------

create temp table first_day as
  select public.award_session(
    pg_temp.play('00000000-0000-4000-8000-0000000000c1', '2026-10-05'), pg_temp.verdicts(10),
    '2026-10-05 18:00+02') as award;
select is(
  (select award -> 'badges' from first_day),
  '["sessions-1", "combo-10", "perfect-1"]',
  'A first perfect mission: first mission, 10 in a row and first perfect session'
);
select is(
  public.award_session((select (award ->> 'session_id')::uuid from first_day), '[]',
    '2026-10-05 19:00+02') -> 'badges',
  '["sessions-1", "combo-10", "perfect-1"]',
  'Awarding the session again returns the same badges'
);
select is(
  (select count(*)::int from public.child_badges
   where child_id = '00000000-0000-4000-8000-0000000000c1'),
  3,
  'and grants nothing twice'
);

select is(pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-10-06'), '[]',
  'Day 2: nothing new');
select is(pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-10-07'), '["streak-3"]',
  'Day 3: 3 days of streak');
select is(pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-10-08'), '[]',
  'Day 4: nothing new');
select is(pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-10-09'), '[]',
  'Day 5: nothing new');
select is(pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-10-10'), '["weekend"]',
  'Day 6, a Saturday: a weekend session');
select is(pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-10-11'),
  '["streak-7", "rare-chest"]',
  'Day 7: a week of streak, and its rare chest');

-- Monday is covered by the free freeze, Tuesday breaks the streak: Wednesday starts it again.
select is(pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-10-14'), '["comeback"]',
  'After a broken streak of 7 days, the next mission is a comeback');

-- Mastery, as the device synced it.
insert into public.child_skill_mastery (
  child_id, skill_code, elo, mastery, status, attempts_count, sessions_streak, mastered_at,
  last_practiced_at
)
select '00000000-0000-4000-8000-0000000000c1', code, 1500, 90, 'mastered', 30, 2,
  '2026-10-14 18:00+02', '2026-10-14 18:00+02'
from public.skills
where code in ('ce2.tables-multiplication', 'ce2.complements', 'ce2.doubles-moities',
  'ce2.masses', 'ce2.polygones', 'ce2.tableaux-graphiques');
select is(pg_temp.day('00000000-0000-4000-8000-0000000000c1', '2026-10-15'),
  '["mastery-1", "mastery-5", "tables", "mental-math", "all-domains"]',
  'Mastered skills: first ones, the tables, mental calculation and all four domains');

select is(
  private.badge_metrics('00000000-0000-4000-8000-0000000000c1')
    - 'mastered_skills' - 'tables_mastered' - 'automatisms_mastered' - 'mastered_domains'
    - 'gems_earned',
  jsonb_build_object(
    'streak_best', 7, 'validated_daily', 9, 'weekend_sessions', 2, 'comebacks', 1,
    'best_combo', 10, 'perfect_sessions', 1, 'correct_answers', 82, 'bonus_sessions', 0,
    'rare_chests', 1, 'explored_skills', 1, 'level', 4),
  'The measures behind the badges'
);

-- The server's grading, not the device's ----------------------------------------------------------

select is(pg_temp.day('00000000-0000-4000-8000-0000000000c2', '2026-10-05', 9), '["sessions-1"]',
  'A device claiming 10 right answers out of 10 when the server finds 9 gets no perfect badge');
select is(
  pg_temp.day('00000000-0000-4000-8000-0000000000c2', '2026-10-05', 10, 'bonus', 800),
  '["perfect-1", "bonus-1"]',
  'Answers too fast to be read make a perfect session, but no combo'
);

-- Reading badges ---------------------------------------------------------------------------------------

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select is(
  (select count(*)::int from public.child_badges),
  13,
  'Alice reads Léa''s badges'
);
select is(
  (public.child_badge_metrics('00000000-0000-4000-8000-0000000000c1') ->> 'streak_best')::int,
  7,
  'and how far she is from the next ones'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select is(
  (select count(*)::int from public.child_badges
   where child_id = '00000000-0000-4000-8000-0000000000c1'),
  13,
  'Léa''s device reads her badges'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select is(
  (select array_agg(badge_code order by badge_code) from public.child_badges),
  '{bonus-1,perfect-1,sessions-1}',
  'Bob only reads Tom''s badges'
);
select is((select count(*)::int from public.badges), 37, 'Everyone signed in reads the catalog');
select throws_ok(
  $$select public.child_badge_metrics('00000000-0000-4000-8000-0000000000c1')$$,
  'PT404', 'child_not_found',
  'Bob cannot read Léa''s measures'
);

set local role anon;
select throws_ok(
  $$select public.child_badge_metrics('00000000-0000-4000-8000-0000000000c1')$$,
  '42501', null,
  'Nor can a signed-out visitor'
);

select * from finish();
rollback;
