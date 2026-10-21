-- Statistics and recaps (phase 9) on a simulated month: Léa's September 2026, with days done,
-- skipped (started or missed), days off and holidays. Run with `pnpm supabase:test`.
--
-- Léa (CM1) plays on weekdays, start 17:00, deadline 20:30, holidays from 21 to 25 September.
-- September has 17 planned days: 13 done, 4 skipped (the 9th started, the 11th with a placement
-- test only, the 18th and the 29th missed), 8 days off (weekends) and 5 days of holidays; she also
-- played on Saturday 12 (bonus) and during the holidays (Wednesday 23).
begin;
create extension if not exists pgtap with schema extensions;
select plan(112);

insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'bob@example.com',
   '{"display_name": "Bob", "privacy_consent_version": "2026-10"}', false),
  -- Carla joins Alice's family (no family of her own: no consent metadata).
  ('00000000-0000-4000-8000-0000000000a2', 'authenticated', 'authenticated', 'carla@example.com',
   '{}', false),
  ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', null, '{}', true);

insert into public.parents (user_id, family_id, role, display_name, privacy_consent_at, privacy_consent_version)
select '00000000-0000-4000-8000-0000000000a2', p.family_id, 'co_parent', 'Carla', now(), '2026-10'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';
-- Carla wants neither the weekly notification nor the monthly email.
update public.recap_preferences set weekly_push = false, monthly_email = false
where parent_id = (select id from public.parents where display_name = 'Carla');

insert into public.children (id, family_id, display_name, gender, grade, created_at)
select child.id, p.family_id, child.name, 'girl', child.grade::public.grade, '2026-08-15'
from (values
  ('00000000-0000-4000-8000-0000000000c1'::uuid, 'Léa', 'CM1', '00000000-0000-4000-8000-0000000000a1'::uuid),
  ('00000000-0000-4000-8000-0000000000c2'::uuid, 'Tom', 'CE2', '00000000-0000-4000-8000-0000000000b1'::uuid)
) as child (id, name, grade, user_id)
join public.parents p on p.user_id = child.user_id;

insert into public.devices (id, user_id, family_id, platform)
select '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000d1', p.family_id, 'ios'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';
insert into public.device_children (device_id, child_id)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1');

insert into public.routines (child_id, days, start_time, deadline_time, goal_type, goal_value, created_at)
values ('00000000-0000-4000-8000-0000000000c1', '{1,2,3,4,5}', '17:00', '20:30', 'duration', 15, '2026-08-20');
insert into public.vacations (child_id, from_date, to_date)
values ('00000000-0000-4000-8000-0000000000c1', '2026-09-21', '2026-09-25');

-- Sessions: 15 minutes and 70 XP each when finished; the 9th left after 5 minutes; a 10-minute
-- placement test on the 11th, finished at 17:30.
insert into public.sessions (
  id, child_id, kind, local_date, started_at, completed_at, goal_type, goal_value, answered, score,
  duration_s, goal_met, xp_awarded, awarded_at
)
select
  ('00000000-0000-4000-8000-1000000000' || lpad(d.day::text, 2, '0'))::uuid,
  '00000000-0000-4000-8000-0000000000c1', d.kind::public.session_kind, make_date(2026, 9, d.day),
  make_timestamptz(2026, 9, d.day, 17, 5, 0, 'Europe/Paris'),
  case when d.finished then make_timestamptz(2026, 9, d.day, 17, d.ends, 0, 'Europe/Paris') end,
  'duration', 15, 10, 8, d.seconds, d.finished and d.kind <> 'placement',
  case when d.finished and d.kind <> 'placement' then 70 end,
  case when d.finished then make_timestamptz(2026, 9, d.day, 17, d.ends + 1, 0, 'Europe/Paris') end
from (values
  (1, 'daily', true, 900, 20), (2, 'daily', true, 900, 20), (3, 'daily', true, 900, 20),
  (4, 'daily', true, 900, 20), (7, 'daily', true, 900, 20), (8, 'daily', true, 900, 20),
  (9, 'daily', false, 300, 20), (10, 'daily', true, 900, 20), (11, 'placement', true, 600, 30),
  (12, 'bonus', true, 900, 20), (14, 'daily', true, 900, 20), (15, 'daily', true, 900, 20),
  (16, 'daily', true, 900, 20), (17, 'daily', true, 900, 20), (23, 'daily', true, 900, 20),
  (28, 'daily', true, 900, 20), (30, 'daily', true, 900, 20)
) as d (day, kind, finished, seconds, ends);

-- Ten answers per finished session, two of them wrong: comparing decimals every time (the
-- decimals read as whole numbers until the 20th, then the order reversed), decimal numbers on
-- even days, the division on odd days.
insert into public.attempts (
  session_id, child_id, position, skill_code, generator_id, difficulty, seed, slot, answer,
  is_correct, verified, error_type, time_ms, answered_at, learner_elo
)
select s.id, s.child_id, p.pos, skill.code, skill.code, 2, 1000 + p.pos, 'current',
  -- The wrong answers each generator expects for these seeds (the right ones do not matter here).
  case skill.code
    when 'cm1.comparer-decimaux' then '{"type": "order", "order": [1, 3, 2, 0]}'
    when 'cm1.nombres-decimaux' then '{"type": "numeric", "text": "4,57"}'
    else '{"type": "numeric", "text": "4"}'
  end::jsonb, not wrong.is, not wrong.is,
  case when not wrong.is then null
    when p.pos = 2 then case when extract(day from s.local_date) < 20 then 'decimals-as-integers'
      else 'reverse-order' end
    when p.pos = 5 then 'decimal-place-value'
    else 'quotient-remainder' end,
  5000, s.started_at + p.pos * interval '1 minute', 1100
from public.sessions s
cross join generate_series(0, 9) as p (pos)
cross join lateral (select case
  when p.pos < 4 then 'cm1.comparer-decimaux'
  when p.pos < 7 then 'cm1.nombres-decimaux'
  else 'cm1.division-euclidienne' end as code) skill
cross join lateral (select
  p.pos = 2 or (p.pos = 5 and extract(day from s.local_date)::integer % 2 = 0)
    or (p.pos = 8 and extract(day from s.local_date)::integer % 2 = 1) as is) wrong
where s.child_id = '00000000-0000-4000-8000-0000000000c1' and s.completed_at is not null
  and s.kind <> 'placement';

-- The session left unfinished: 4 answers on comparing decimals, 2 wrong. The placement test: 3
-- « Je ne sais pas » on fractions, which neither the curves nor the points of difficulty count.
insert into public.attempts (
  session_id, child_id, position, skill_code, generator_id, difficulty, seed, slot, answer,
  is_correct, error_type, time_ms, answered_at, learner_elo
)
select s.id, s.child_id, p.pos, a.skill, a.skill, 2, 2000 + p.pos, 'current', a.answer::jsonb,
  case when s.kind = 'placement' then false else p.pos not in (1, 2) end,
  case when s.kind <> 'placement' and p.pos = 2 then 'decimals-as-integers' end,
  5000, s.started_at + p.pos * interval '1 minute', 1100
from public.sessions s
cross join lateral (select
  case when s.kind = 'placement' then 'cm1.fractions-droite-graduee' else 'cm1.comparer-decimaux' end as skill,
  case when s.kind = 'placement' then '{"type": "skipped"}' else '{"type": "numeric", "text": "1"}' end as answer) a
cross join generate_series(0, case when s.kind = 'placement' then 2 else 3 end) as p (pos)
where s.id in ('00000000-0000-4000-8000-100000000009', '00000000-0000-4000-8000-100000000011');

-- Mastery: comparing decimals before the month (30) and at its end (50); decimal numbers mastered
-- on the 16th; the division acquired by the placement test (17:31), fading since the 23rd; the
-- proportionality mastered on the 28th; the perimeter weak; a CE2 skill mastered in August and a
-- CE2 gap (the tables).
insert into public.child_skill_mastery (
  child_id, skill_code, elo, mastery, status, attempts_count, sessions_streak, mastered_at,
  last_practiced_at
)
values
  ('00000000-0000-4000-8000-0000000000c1', 'cm1.comparer-decimaux', 1040, 30, 'in_progress', 10, 0,
   null, '2026-08-31 17:20+02'),
  ('00000000-0000-4000-8000-0000000000c1', 'cm1.nombres-decimaux', 1480, 85, 'mastered', 30, 2,
   '2026-09-16 17:20+02', '2026-09-30 17:15+02'),
  ('00000000-0000-4000-8000-0000000000c1', 'cm1.division-euclidienne', 1450, 81, 'mastered', 3, 1,
   '2026-09-11 17:31+02', '2026-09-23 17:10+02'),
  ('00000000-0000-4000-8000-0000000000c1', 'cm1.proportionnalite', 1460, 82, 'mastered', 12, 2,
   '2026-09-28 17:25+02', '2026-09-28 17:25+02'),
  ('00000000-0000-4000-8000-0000000000c1', 'cm1.perimetre', 1100, 37, 'in_progress', 6, 0,
   null, '2026-09-15 17:10+02'),
  ('00000000-0000-4000-8000-0000000000c1', 'ce2.addition-posee', 1500, 87, 'mastered', 20, 2,
   '2026-08-30 17:20+02', '2026-08-30 17:20+02'),
  ('00000000-0000-4000-8000-0000000000c1', 'ce2.tables-multiplication', 1000, 25, 'in_progress', 8, 0,
   null, '2026-09-20 17:10+02');
update public.child_skill_mastery
set elo = 1200, mastery = 50, attempts_count = 44, last_practiced_at = '2026-09-30 17:20+02'
where child_id = '00000000-0000-4000-8000-0000000000c1' and skill_code = 'cm1.comparer-decimaux';

-- Badges at the month's edges (Paris time): 1 September 01:30, 4 September, 1 October 00:30.
insert into public.child_badges (child_id, badge_code, earned_at)
values
  ('00000000-0000-4000-8000-0000000000c1', 'sessions-1', '2026-08-31 23:30+00'),
  ('00000000-0000-4000-8000-0000000000c1', 'streak-3', '2026-09-04 17:21+02'),
  ('00000000-0000-4000-8000-0000000000c1', 'sessions-10', '2026-09-30 22:30+00');
insert into public.parent_rewards (child_id, title, goal, target, unlocked_at)
values
  ('00000000-0000-4000-8000-0000000000c1', 'Une sortie au cinéma', 'streak', 3, '2026-09-17 17:21+02'),
  ('00000000-0000-4000-8000-0000000000c1', 'Un livre', 'xp', 900, '2026-10-01 18:00+02'),
  ('00000000-0000-4000-8000-0000000000c1', 'Une console', 'xp', 99999, null);

create function pg_temp.as_user(id text, anonymous boolean default false) returns void
language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', id, 'role', 'authenticated', 'is_anonymous', anonymous)::text, true);
$$;

create function pg_temp.progress(p_now timestamptz, p_range text default 'month') returns jsonb
language sql as $$
  select public.child_progress('00000000-0000-4000-8000-0000000000c1', p_range, null, p_now);
$$;

create function pg_temp.day_status(p jsonb, day text) returns text language sql as $$
  select d ->> 'status' from jsonb_array_elements(p -> 'calendar' -> 'days') d
  where d ->> 'date' = day;
$$;

create function pg_temp.list(p jsonb, which text) returns text[] language sql as $$
  select coalesce(array_agg(s ->> 'code' order by s ->> 'code'), '{}')
  from jsonb_array_elements(p -> 'skills') s where s ->> 'list' = which;
$$;

create function pg_temp.recap(which public.recap_kind) returns jsonb language sql as $$
  select content from public.recaps
  where child_id = '00000000-0000-4000-8000-0000000000c1' and kind = which;
$$;

create function pg_temp.recap_id(which public.recap_kind) returns uuid language sql as $$
  select id from public.recaps
  where child_id = '00000000-0000-4000-8000-0000000000c1' and kind = which;
$$;

-- Rules shared with the engine and the app -----------------------------------------------------------

-- The case of masteryOf and masteryStatus in packages/exercise-engine (mastery.test.ts).
select is(
  array[
    private.mastery_at(1500, '2026-03-01', '2026-03-01'),
    private.mastery_at(1500, '2026-03-01', '2026-03-08'),
    private.mastery_at(1500, '2026-03-01', '2026-03-31'),
    private.mastery_at(1500, '2026-03-01', '2027-03-01')
  ]::integer[],
  array[88, 85, 74, 63],
  'Mastery fades as in the engine: 4 points of rating a day after two days, 200 at most'
);
select is(
  array[
    private.mastery_status_at(1500, 0, null, null, '2026-03-08'),
    private.mastery_status_at(1500, 12, null, '2026-03-01', '2026-03-08'),
    private.mastery_status_at(1500, 12, '2026-03-01', '2026-03-01', '2026-03-08'),
    private.mastery_status_at(1500, 12, '2026-03-01', '2026-03-01', '2026-03-31')
  ]::text[],
  array['to_discover', 'in_progress', 'mastered', 'to_review'],
  'A mastered skill stays mastered while it holds 80, then is to review'
);
select is(
  array[
    private.school_year_progress('2026-09-01'), private.school_year_progress('2027-06-30'),
    private.school_year_progress('2027-08-15'), round(private.school_year_progress('2026-09-30'), 3)
  ],
  array[0, 1, 1, 0.096]::numeric[],
  'The school year runs from September to June'
);
select is(
  array[
    private.recap_verdict(0, 0, 0, 0, 0) ->> 'level',
    private.recap_verdict(10, 9, 100, 85, 9) ->> 'level',
    private.recap_verdict(10, 7, 100, 85, 7) ->> 'level',
    private.recap_verdict(10, 4, 100, 85, 4) ->> 'level',
    private.recap_verdict(0, 0, 50, 25, 5) ->> 'level',
    private.recap_verdict(10, 9, 100, 65, 9) ->> 'level',
    private.recap_verdict(3, 0, 0, 0, 0) ->> 'level',
    private.recap_verdict(0, 0, 8, 2, 2) ->> 'level'
  ],
  array['none', 'good', 'watch', 'alert', 'alert', 'watch', 'alert', 'good'],
  'The verdict: 80 % of planned days and 70 % right for good, under 50 % or 60 % for an alert'
);
select is(
  private.recap_verdict(10, 7, 100, 65, 7) - array['level', 'planned', 'done', 'active', 'answered', 'correct'],
  '{"regularity": 0.70, "success": 0.65, "irregular": true, "struggling": true}'::jsonb,
  'The verdict says why'
);
select is(
  (select count(*)::integer from public.mastery_history
   where child_id = '00000000-0000-4000-8000-0000000000c1'),
  8,
  'Every value a mastery record took is kept'
);

-- The « Progrès » page on Wednesday 30 September at 21:00 ------------------------------------------

select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
create temp table page on commit drop as select pg_temp.progress('2026-09-30 21:00+02') as p;
grant select on page to authenticated;
set local role authenticated;

select is((select p ->> 'today' from page), '2026-09-30', 'The page is computed in the family''s calendar');
select is(
  (select jsonb_array_length(p -> 'calendar' -> 'days') from page), 30,
  'The calendar shows the 30 days of September'
);
select is(
  (select array[
    pg_temp.day_status(p, '2026-09-01'), pg_temp.day_status(p, '2026-09-09'),
    pg_temp.day_status(p, '2026-09-11'), pg_temp.day_status(p, '2026-09-12'),
    pg_temp.day_status(p, '2026-09-13'), pg_temp.day_status(p, '2026-09-18'),
    pg_temp.day_status(p, '2026-09-23'), pg_temp.day_status(p, '2026-09-24'),
    pg_temp.day_status(p, '2026-09-29'), pg_temp.day_status(p, '2026-09-30')
  ] from page),
  array['done', 'started', 'missed', 'done', 'off', 'missed', 'done', 'vacation', 'missed', 'done'],
  'Done, started, missed (a placement test is not the day''s session), day off and holidays'
);
select is(
  (select array_agg(d ->> 'status' order by d ->> 'date')
   from page, jsonb_array_elements(p -> 'calendar' -> 'days') d
   where d ->> 'date' in ('2026-09-01', '2026-09-05')),
  array['done', 'off'],
  'Weekends are days off'
);
select is(
  (select p -> 'calendar' -> 'days' -> 0 -> 'minutes' from page), '15'::jsonb,
  'Each day of the calendar has its active time'
);
select is(
  (select (p -> 'verdict') - array['level', 'irregular', 'struggling', 'regularity', 'success'] from page),
  '{"planned": 5, "done": 3, "active": 4, "answered": 40, "correct": 32}'::jsonb,
  'The verdict covers the last two weeks: 3 of the 5 planned days, holidays aside'
);
select is(
  (select array[p -> 'verdict' ->> 'level', p -> 'verdict' ->> 'irregular',
    p -> 'verdict' ->> 'struggling'] from page),
  array['watch', 'true', 'false'],
  'Some sessions missed, success is fine: to watch'
);
select is(
  (select p -> 'domains' from page),
  '[{"domain": "numbers", "value": 54, "mastered": 1, "total": 4},
    {"domain": "measures", "value": 31, "mastered": 0, "total": 1},
    {"domain": "data", "value": 82, "mastered": 1, "total": 1}]'::jsonb,
  'Mastery of the CM1 programme by domain, skills not worked on counting 0'
);
select is(
  (select pg_temp.list(p, 'mastered') from page),
  '{cm1.nombres-decimaux,cm1.proportionnalite}',
  'Skills mastered'
);
select is(
  (select pg_temp.list(p, 'in_progress') from page),
  '{cm1.comparer-decimaux}',
  'Skills in progress'
);
select is(
  (select pg_temp.list(p, 'to_consolidate') from page),
  '{ce2.addition-posee,ce2.tables-multiplication,cm1.division-euclidienne,cm1.perimetre}',
  'To consolidate: faded below 80, weak after 6 answers, or a gap in an earlier grade'
);
select is(
  (select (s ->> 'mastery')::integer from page, jsonb_array_elements(p -> 'skills') s
   where s ->> 'code' = 'cm1.division-euclidienne'),
  79,
  'The page shows mastery as it stands now, faded'
);
select is(
  (select array_agg(b ->> 'skill' order by (b ->> 'errors')::integer desc)
   from page, jsonb_array_elements(p -> 'blocking') b),
  '{cm1.comparer-decimaux,cm1.nombres-decimaux,cm1.division-euclidienne}',
  'The three skills with the most mistakes this month'
);
select is(
  (select (p -> 'blocking' -> 0) - 'example' - 'title' from page),
  '{"skill": "cm1.comparer-decimaux", "grade": "CM1", "domain": "numbers", "errors": 17,
    "answered": 64, "error_type": "decimals-as-integers",
    "error_label": "compare les chiffres après la virgule comme des nombres entiers"}'::jsonb,
  'Each with its errors, its answers and its most frequent typical mistake'
);
select is(
  (select (p -> 'blocking' -> 0 -> 'example') - 'answered_at' from page),
  '{"generator_id": "cm1.comparer-decimaux", "difficulty": 2, "seed": 1002,
    "answer": {"type": "order", "order": [1, 3, 2, 0]}, "error_type": "decimals-as-integers",
    "error_label": "compare les chiffres après la virgule comme des nombres entiers"}'::jsonb,
  'And a real wrong answer with that mistake, to rebuild with the engine'
);
select is(
  (select (p -> 'blocking' -> 0 -> 'example' ->> 'answered_at')::timestamptz from page),
  '2026-09-17 17:07+02'::timestamptz,
  'The latest one'
);
select is(
  (select p -> 'programme' from page),
  '{"grade": "CM1", "year_progress": 0.10, "total": 6, "expected": 1, "mastered": 2,
    "working": 3, "gaps": 1, "gap_titles": ["Connaître les tables de multiplication de 2 à 10"],
    "position": "on_track"}'::jsonb,
  'Against the programme: the class met about 1 of the 6 skills; Léa masters 2 and works on 3'
);
select is(
  (select array[p -> 'series' ->> 'from', p -> 'series' ->> 'to'] from page),
  array['2026-09-01', '2026-09-30'],
  'A month of curves: the last 30 days'
);
select is(
  (select jsonb_array_length(p -> 'series' -> 'days') from page), 30,
  'One point a day'
);
select is(
  (select sum((d ->> 'xp')::integer)::integer from page, jsonb_array_elements(p -> 'series' -> 'days') d),
  1050,
  'XP of the 15 sessions finished'
);
select is(
  (select array_agg(array[w ->> 'start', w ->> 'minutes', w ->> 'xp'] order by w ->> 'start')
   from page, jsonb_array_elements(p -> 'series' -> 'weeks') w),
  array[
    array['2026-08-31', '60', '280'], array['2026-09-07', '75', '280'],
    array['2026-09-14', '60', '280'], array['2026-09-21', '15', '70'],
    array['2026-09-28', '30', '140']
  ],
  'And by week (a placement test counts in the time spent)'
);
select is(
  (select array_agg(d ->> 'minutes' order by d ->> 'date')
   from jsonb_array_elements(pg_temp.progress('2026-09-30 21:00+02', 'week') -> 'series' -> 'days') d),
  array['0', '0', '0', '0', '15', '0', '15'],
  'A week of curves: 7 days'
);
select is(
  (select jsonb_array_length(pg_temp.progress('2026-09-30 21:00+02', 'quarter') -> 'series' -> 'weeks')),
  13,
  'A quarter: 13 weeks'
);
select is(
  (select array[x -> 'calendar' ->> 'month', jsonb_array_length(x -> 'calendar' -> 'days')::text]
   from (select public.child_progress('00000000-0000-4000-8000-0000000000c1', 'month',
     '2026-08-12', '2026-09-30 21:00+02') as x) q),
  array['2026-08-01', '31'],
  'The calendar shows another month on demand'
);
select is(
  (select array_agg(d ->> 'status' order by d ->> 'date')
   from jsonb_array_elements(public.child_progress('00000000-0000-4000-8000-0000000000c1', 'month',
     '2026-08-01', '2026-09-30 21:00+02') -> 'calendar' -> 'days') d
   where d ->> 'date' in ('2026-08-18', '2026-08-20', '2026-08-31')),
  array['none', 'missed', 'missed'],
  'Days before the routine was set were not planned'
);
select throws_ok(
  $$ select public.child_progress('00000000-0000-4000-8000-0000000000c1', 'year') $$,
  'PT400', 'invalid_range',
  'Curves cover a week, a month or a quarter'
);
select is(
  (select pg_temp.day_status(pg_temp.progress('2026-09-30 20:00+02'), '2026-09-30')),
  'done',
  'A day done before its deadline is done'
);

-- Access: the parents of the family only.
select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select throws_ok(
  $$ select pg_temp.progress('2026-09-30 21:00+02') $$,
  'PT404', 'child_not_found',
  'Another family cannot read Léa''s progress'
);
select is(
  (select count(*)::integer from public.mastery_history),
  0,
  'Nor her mastery history'
);
select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select throws_ok(
  $$ select pg_temp.progress('2026-09-30 21:00+02') $$,
  'PT404', 'child_not_found',
  'The child''s device has no access to the parent''s page'
);
select is(
  (select count(*)::integer from public.mastery_history),
  0,
  'Nor to the mastery history'
);
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select is(
  (select count(*)::integer from public.mastery_history),
  8,
  'Léa''s parents read her mastery history'
);
select throws_ok(
  $$ insert into public.mastery_history (child_id, skill_code, elo, attempts_count, recorded_at)
     values ('00000000-0000-4000-8000-0000000000c1', 'cm1.perimetre', 2000, 1, now()) $$,
  '42501', null,
  'Nobody writes the mastery history'
);

-- The child's card --------------------------------------------------------------------------------

select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select is(
  public.child_highlights('00000000-0000-4000-8000-0000000000c1', '2026-10-01 18:00+02'),
  '{"kind": "month", "from": "2026-09-01", "to": "2026-09-30", "days": 15, "correct": 122,
    "xp": 1050, "learned": 2, "badges": 2}'::jsonb,
  'The first days of October, the child''s card sums up September: learnt and done only'
);
select is(
  public.child_highlights('00000000-0000-4000-8000-0000000000c1', '2026-09-30 18:00+02'),
  '{"kind": "week", "from": "2026-09-21", "to": "2026-09-27", "days": 1, "correct": 8, "xp": 70,
    "learned": 0, "badges": 0}'::jsonb,
  'From Monday to Wednesday, last week'
);
select is(
  public.child_highlights('00000000-0000-4000-8000-0000000000c1', '2026-09-24 18:00+02'),
  null,
  'Not the rest of the week'
);
select is(
  public.child_highlights('00000000-0000-4000-8000-0000000000c1', '2026-08-03 18:00+02'),
  null,
  'Nothing when there is nothing to celebrate'
);
select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select throws_ok(
  $$ select public.child_highlights('00000000-0000-4000-8000-0000000000c1', '2026-10-01 18:00+02') $$,
  'PT404', 'child_not_found',
  'Another family cannot read the child''s card'
);

-- Weekly recap: Sunday 20 September at 19:00 -------------------------------------------------------

reset role;
select is(private.enqueue_recaps('2026-09-20 18:59+02'), 0, 'Nothing before Sunday 19:00');
select is(private.enqueue_recaps('2026-09-20 19:00+02'), 1, 'At 19:00, the week of each child who played');
select is(private.enqueue_recaps('2026-09-20 19:15+02'), 0, 'Once');
select is(
  (select array[kind::text, period_start::text, period_end::text] from public.recaps),
  array['weekly', '2026-09-14', '2026-09-20'],
  'Léa''s week from Monday to Sunday; Tom never played'
);
select is(
  pg_temp.recap('weekly') - array['child', 'days', 'learned', 'to_work', 'verdict'],
  '{"kind": "weekly", "from": "2026-09-14", "to": "2026-09-20", "planned": 5, "done": 4,
    "extra": 0, "active": 4, "minutes": 60, "answered": 40, "correct": 32, "xp": 280,
    "streak": 4, "best_streak": 7}'::jsonb,
  'Sessions done on planned, streak, time, success and XP'
);
select is(
  pg_temp.recap('weekly') -> 'learned',
  '[{"skill": "cm1.nombres-decimaux", "title": "Lire, écrire et décomposer des nombres décimaux"}]'::jsonb,
  'A skill learnt'
);
select is(
  array[pg_temp.recap('weekly') -> 'to_work' ->> 'skill', pg_temp.recap('weekly') -> 'to_work' ->> 'errors'],
  array['cm1.comparer-decimaux', '4'],
  'A point to work on'
);
select is(
  pg_temp.recap('weekly') -> 'verdict' ->> 'level',
  'good',
  'A good week'
);
select is(
  (select array_agg(array[r.email::text, n.title, n.body, n.url, n.audience::text])
   from public.notifications n join auth.users r on r.id = n.recipient_id
   where n.kind = 'weekly_recap'),
  array[array['alice@example.com', 'Récap de la semaine',
    'Léa' || chr(160) || ': 4 séances sur 5 prévues, 60' || chr(160) || 'min, 80' || chr(160)
      || '% de réussite.',
    '/parent/children/00000000-0000-4000-8000-0000000000c1/progress', 'parent']],
  'Alice is notified; Carla turned the weekly notification off'
);

-- Monthly recap: 1 October at 09:00 ------------------------------------------------------------------

select is(private.enqueue_recaps('2026-10-01 08:59+02'), 0, 'Nothing before 09:00 on the 1st');
select is(private.enqueue_recaps('2026-10-01 09:00+02'), 1, 'At 09:00, last month');
select is(private.enqueue_recaps('2026-10-01 09:15+02'), 0, 'Once');
select is(
  pg_temp.recap('monthly') -> 'child',
  '{"id": "00000000-0000-4000-8000-0000000000c1", "name": "Léa", "grade": "CM1"}'::jsonb,
  'The monthly recap names the child for the parent'
);
select is(
  pg_temp.recap('monthly') - array['child', 'days', 'done_dates', 'skipped_dates', 'domains',
    'learned', 'badges', 'rewards', 'blocking', 'programme', 'verdict'],
  '{"kind": "monthly", "from": "2026-09-01", "to": "2026-09-30", "planned": 17, "done": 13,
    "active": 16, "off_days": 8, "vacation_days": 5, "minutes": 240, "answered": 154,
    "correct": 122, "xp": 1050, "streak": 7, "best_streak": 7}'::jsonb,
  'September: 13 days done of 17 planned, 8 days off, 5 days of holidays, time, success, XP, streak'
);
select is(
  pg_temp.recap('monthly') -> 'done_dates',
  '["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-07", "2026-09-08",
    "2026-09-10", "2026-09-12", "2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17",
    "2026-09-23", "2026-09-28", "2026-09-30"]'::jsonb,
  'The dates of the days done, the Saturday and the holiday included'
);
select is(
  pg_temp.recap('monthly') -> 'skipped_dates',
  '[{"date": "2026-09-09", "started": true}, {"date": "2026-09-11", "started": false},
    {"date": "2026-09-18", "started": false}, {"date": "2026-09-29", "started": false}]'::jsonb,
  'The dates of the days skipped, the one started said so'
);
select is(
  (select count(*)::integer from jsonb_array_elements(pg_temp.recap('monthly') -> 'days') d
   where d ->> 'plan' = 'vacation' and d ->> 'status' = 'vacation'),
  4,
  'Holidays are neither done nor skipped (but the day she played)'
);
select is(
  pg_temp.recap('monthly') -> 'domains',
  '[{"domain": "numbers", "start": 8, "end": 54, "mastered": 1, "total": 4},
    {"domain": "measures", "start": 0, "end": 31, "mastered": 0, "total": 1},
    {"domain": "data", "start": 0, "end": 82, "mastered": 1, "total": 1}]'::jsonb,
  'Mastery by domain at the start and at the end of the month'
);
select is(
  pg_temp.recap('monthly') -> 'learned',
  '[{"skill": "cm1.nombres-decimaux", "title": "Lire, écrire et décomposer des nombres décimaux"},
    {"skill": "cm1.proportionnalite", "title": "Résoudre des situations simples de proportionnalité"}]'::jsonb,
  'Skills learnt through practice (not the one the placement test acquired)'
);
select is(
  pg_temp.recap('monthly') -> 'badges',
  '["sessions-1", "streak-3"]'::jsonb,
  'Badges won in September, Paris time'
);
select is(
  pg_temp.recap('monthly') -> 'rewards',
  '["Une sortie au cinéma"]'::jsonb,
  'Rewards unlocked in September'
);
select is(
  (select array_agg(array[b ->> 'skill', b ->> 'errors'])
   from jsonb_array_elements(pg_temp.recap('monthly') -> 'blocking') b),
  array[array['cm1.comparer-decimaux', '17'], array['cm1.nombres-decimaux', '9'],
    array['cm1.division-euclidienne', '6']],
  'The points of difficulty of the month'
);
select is(
  pg_temp.recap('monthly') -> 'programme' ->> 'position',
  'on_track',
  'On track with the programme at the end of September'
);
select is(
  (pg_temp.recap('monthly') -> 'verdict') - array['level', 'irregular', 'struggling'],
  '{"regularity": 0.76, "success": 0.79, "planned": 17, "done": 13, "active": 16,
    "answered": 154, "correct": 122}'::jsonb,
  'The month''s verdict'
);
select is(
  (select array_agg(array[r.email::text, n.title, n.body] order by r.email::text)
   from public.notifications n join auth.users r on r.id = n.recipient_id
   where n.kind = 'monthly_recap'),
  array[
    array['alice@example.com', 'Récap de septembre',
      'Le bilan du mois de Léa est prêt' || chr(160) || ': 13 jours faits sur 17 prévus.'],
    array['carla@example.com', 'Récap de septembre',
      'Le bilan du mois de Léa est prêt' || chr(160) || ': 13 jours faits sur 17 prévus.']
  ],
  'Both parents are notified of the month'
);
select is(
  (select title from private.recap_notification_content('monthly', 'Léa', 'en',
    '{"from": "2026-10-01", "planned": 0}')),
  'Récap d’octobre',
  'Other languages fall back to French'
);
select is(
  (select body from private.recap_notification_content('weekly', 'Léa', 'fr',
    '{"planned": 0, "active": 1, "minutes": 15, "verdict": {"success": null}}')),
  'Léa' || chr(160) || ': 1 jour d’exercices, 15' || chr(160) || 'min.',
  'A week without a routine counts the days played'
);

-- Each notification goes to its own parent's phones.
insert into public.push_tokens (user_id, token, platform)
values
  ('00000000-0000-4000-8000-0000000000a1', 'ExponentPushToken[alice-phone]', 'ios'),
  ('00000000-0000-4000-8000-0000000000a2', 'ExponentPushToken[carla-phone]', 'android');
select private.send_notifications('2026-10-01 09:01+02');
select is(
  (select array_agg(array[r.email::text, n.push_tokens[1]] order by r.email::text)
   from public.notifications n join auth.users r on r.id = n.recipient_id
   where n.kind = 'monthly_recap'),
  array[array['alice@example.com', 'ExponentPushToken[alice-phone]'],
    array['carla@example.com', 'ExponentPushToken[carla-phone]']],
  'A notification meant for one parent goes to that parent''s phone only'
);

-- Delivery (the recaps Edge Function, service role) ---------------------------------------------------

select is(
  (select jsonb_agg(r ->> 'kind') from jsonb_array_elements(public.recaps_to_deliver(20, '2026-09-20 19:05+02')) r),
  '["weekly"]'::jsonb,
  'The week waits for its emails'
);
select is(
  (select jsonb_agg(r ->> 'kind') from jsonb_array_elements(public.recaps_to_deliver(20, '2026-10-01 09:05+02')) r),
  '["monthly"]'::jsonb,
  'So does the month; a recap over 3 days old is left aside'
);
select is(
  (select array_agg(x ->> 'email' order by x ->> 'email')
   from jsonb_array_elements(public.recap_delivery(pg_temp.recap_id('weekly')) -> 'recipients') x),
  array['alice@example.com', 'carla@example.com'],
  'The week goes to both parents by email'
);
select is(
  (select array_agg(x ->> 'email')
   from jsonb_array_elements(public.recap_delivery(pg_temp.recap_id('monthly')) -> 'recipients') x),
  array['alice@example.com'],
  'Carla does not want the month by email'
);
select is(
  (select array[d ->> 'language', d ->> 'timezone', d ->> 'grade', d ->> 'summary']
   from (select public.recap_delivery(pg_temp.recap_id('monthly')) as d) q),
  array['fr', 'Europe/Paris', 'CM1', null],
  'With the family''s language and timezone; no profile without the parent''s consent'
);
select lives_ok(
  format($$ select public.recap_save(%L, '{"source": "standard", "tips": ["a", "b", "c"]}',
    'family/child/2026-09.pdf') $$, pg_temp.recap_id('monthly')),
  'The month''s tips and PDF are kept'
);
select lives_ok(
  format($$ select public.recap_email_result(%L, p.id, 'resend-1') from public.parents p
    where p.display_name = 'Alice' $$, pg_temp.recap_id('monthly')),
  'An email sent is recorded'
);
select is(
  public.recap_delivery(pg_temp.recap_id('monthly')) -> 'recipients',
  '[]'::jsonb,
  'And never sent again'
);
select public.recap_done(pg_temp.recap_id('monthly'));
select lives_ok(
  format($$ select public.recap_email_result(%L, p.id, null, 'Resend: 500') from public.parents p
    where p.display_name = 'Carla' $$, pg_temp.recap_id('weekly')),
  'A failed email is recorded'
);
select public.recap_done(pg_temp.recap_id('weekly'), 'Resend: 500');
select is(
  (select array_agg(x ->> 'email' order by x ->> 'email')
   from jsonb_array_elements(public.recap_delivery(pg_temp.recap_id('weekly')) -> 'recipients') x),
  array['alice@example.com', 'carla@example.com'],
  'and tried again'
);
select is(public.recaps_to_deliver(20, '2026-10-01 09:05+02'), '[]'::jsonb, 'A delivered recap leaves the queue');
select is(
  (select jsonb_agg(r ->> 'kind') from jsonb_array_elements(public.recaps_to_deliver(20, '2026-09-20 19:20+02')) r),
  '["weekly"]'::jsonb,
  'A failed one stays in it'
);
update public.recaps set attempts = 5 where id = pg_temp.recap_id('weekly');
select is(public.recaps_to_deliver(20, '2026-09-20 19:20+02'), '[]'::jsonb, 'After 5 tries, a recap is left aside');

select ok(
  public.recap_unsubscribe(
    (select pref.unsubscribe_token from public.recap_preferences pref join public.parents p
     on p.id = pref.parent_id where p.display_name = 'Alice'), 'weekly'),
  'The email''s link unsubscribes from the weekly recap'
);
select is(
  (select array[pref.weekly_email, pref.monthly_email] from public.recap_preferences pref
   join public.parents p on p.id = pref.parent_id where p.display_name = 'Alice'),
  array[false, true],
  'The monthly one keeps coming'
);
select ok(
  not public.recap_unsubscribe(gen_random_uuid(), 'all')
    and not public.recap_unsubscribe(
      (select pref.unsubscribe_token from public.recap_preferences pref join public.parents p
       on p.id = pref.parent_id where p.display_name = 'Alice'), 'everything'),
  'An unknown token or kind changes nothing'
);

-- Access ---------------------------------------------------------------------------------------------

select ok(
  (select bool_and(relrowsecurity) from pg_class where oid in (
    'public.recap_preferences'::regclass, 'public.recaps'::regclass,
    'public.recap_emails'::regclass, 'public.recap_files_trash'::regclass,
    'public.mastery_history'::regclass)),
  'RLS is enabled on every new table'
);
select is(
  (select count(*)::integer from public.recap_preferences),
  3,
  'Every parent has preferences'
);
select is(
  (select schedule from cron.job where jobname = 'run-recaps'),
  '*/15 * * * *',
  'Recaps are looked for every 15 minutes'
);

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select is(
  (select array_agg(kind::text order by kind) from public.recaps),
  array['weekly', 'monthly'],
  'Léa''s parents read her recaps'
);
select is(
  (select advice from public.recaps where kind = 'monthly'),
  '{"source": "standard", "tips": ["a", "b", "c"]}'::jsonb,
  'With the month''s tips'
);
select throws_ok(
  $$ select last_error from public.recaps $$,
  '42501', null,
  'Delivery details stay on the server'
);
select is(
  (select count(*)::integer from public.recap_emails) + (select count(*)::integer from public.recap_files_trash),
  0,
  'So do the emails sent and the files to remove'
);
select is(
  (select array_agg(array[weekly_push, weekly_email, monthly_push, monthly_email]) from public.recap_preferences),
  array[array[true, false, true, true]],
  'A parent reads their own preferences only'
);
select lives_ok(
  $$ update public.recap_preferences set monthly_push = false $$,
  'and changes them'
);
select is(
  (select monthly_push from public.recap_preferences),
  false,
  'The change is kept'
);
select throws_ok(
  $$ update public.recap_preferences set unsubscribe_token = gen_random_uuid() $$,
  '42501', null,
  'The unsubscribe token cannot be changed'
);
select throws_ok(
  $$ select unsubscribe_token from public.recap_preferences $$,
  '42501', null,
  'nor read'
);
select throws_ok(
  $$ select public.recaps_to_deliver() $$,
  '42501', null,
  'Only the server delivers recaps'
);
select throws_ok(
  $$ select public.advice_context('00000000-0000-4000-8000-0000000000c1') $$,
  '42501', null,
  'and reads the coach''s context'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000a2');
select is(
  (select count(*)::integer from public.recap_preferences where monthly_push = false),
  0,
  'Carla''s preferences are her own'
);
select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select is((select count(id)::integer from public.recaps), 0, 'Another family reads no recap');
select is((select count(*)::integer from public.recap_preferences), 1, 'Bob reads his own preferences');
select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select is((select count(id)::integer from public.recaps), 0, 'The child''s device reads no recap');

-- A child removed: their PDFs are left for the Edge Function to delete.
reset role;
delete from public.children where id = '00000000-0000-4000-8000-0000000000c1';
select is(
  array(select public.recap_files_to_delete()),
  array['family/child/2026-09.pdf'],
  'The PDF of a deleted recap is to be removed from Storage'
);
select public.recap_files_deleted(array['family/child/2026-09.pdf']);
select is((select count(*)::integer from public.recap_files_trash), 0, 'Then forgotten');

-- The coach's tips: their own prompt, logged as such.
select is(
  (select array[p.task, p.version::text, p.active::text] from public.ai_prompts p where p.task = 'advice'),
  array['advice', '1', 'true'],
  'The tips have their own prompt'
);
select is(
  (select public.advice_context('00000000-0000-4000-8000-0000000000c2') - array['settings', 'banned', 'spent', 'prompt']),
  '{"grade": "CE2", "band": "cp-ce2"}'::jsonb,
  'The coach knows the grade and age group, nothing else of the child'
);
select is(
  (select public.advice_context('00000000-0000-4000-8000-0000000000c2') -> 'prompt' ->> 'version'),
  '1',
  'and the active prompt of the tips'
);
select lives_ok(
  $$ select public.coach_log_usage('{"task": "advice", "provider": "mistral", "model": "m", "outcome": "ok"}') $$,
  'A call for tips is logged'
);

select * from finish();
rollback;
