-- RLS and day plan for routines and holidays (phase 4). Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

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

create function pg_temp.as_user(id text, anonymous boolean default false) returns void
language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', id, 'role', 'authenticated', 'is_anonymous', anonymous)::text, true);
$$;

select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.routines'::regclass, 'public.vacations'::regclass)),
  'RLS is enabled on routines and holidays'
);

-- Alice ---------------------------------------------------------------------------------------------

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');

-- The shared case of packages/shared/src/routine.test.ts.
select lives_ok(
  $$ insert into public.routines (child_id, days, start_time, wednesday_start_time,
       weekend_start_time, deadline_time, goal_type, goal_value)
     values ('00000000-0000-4000-8000-0000000000c1', '{1,2,3,4,5,6}', '17:00', '14:00', '10:30',
       '20:30', 'duration', 15) $$,
  'A parent sets their child''s routine'
);
select lives_ok(
  $$ insert into public.routines (child_id, days, start_time, deadline_time, goal_type, goal_value)
     values ('00000000-0000-4000-8000-0000000000c3', '{1,2,4,5}', '18:00', '20:00', 'count', 20) $$,
  'Each child has their own routine'
);
select throws_ok(
  $$ insert into public.routines (child_id, days, start_time, deadline_time, goal_type, goal_value)
     values ('00000000-0000-4000-8000-0000000000c2', '{1}', '17:00', '20:00', 'duration', 10) $$,
  '42501', null,
  'A parent cannot set a routine for another family''s child'
);
select throws_ok(
  $$ insert into public.routines (child_id, days, start_time, deadline_time, goal_type, goal_value)
     values ('00000000-0000-4000-8000-0000000000c1', '{1}', '17:00', '20:00', 'duration', 10) $$,
  '23505', null,
  'A child has one routine only'
);
select throws_ok(
  $$ update public.routines set weekend_start_time = '21:00'
     where child_id = '00000000-0000-4000-8000-0000000000c1' $$,
  '23514', null,
  'Every start time comes before the deadline'
);
select throws_ok(
  $$ update public.routines set goal_value = 12
     where child_id = '00000000-0000-4000-8000-0000000000c1' $$,
  '23514', null,
  'The goal is one of those on offer'
);
select throws_ok(
  $$ update public.routines set days = '{0,1}'
     where child_id = '00000000-0000-4000-8000-0000000000c1' $$,
  '23514', null,
  'Days are ISO weekdays'
);

select lives_ok(
  $$ insert into public.vacations (child_id, from_date, to_date)
     values ('00000000-0000-4000-8000-0000000000c1', '2026-10-17', '2026-11-01') $$,
  'A parent adds holidays for their child'
);
select throws_ok(
  $$ insert into public.vacations (child_id, from_date, to_date)
     values ('00000000-0000-4000-8000-0000000000c2', '2026-10-17', '2026-11-01') $$,
  '42501', null,
  'A parent cannot add holidays for another family''s child'
);
select throws_ok(
  $$ insert into public.vacations (child_id, from_date, to_date)
     values ('00000000-0000-4000-8000-0000000000c1', '2026-07-01', '2026-10-01') $$,
  '23514', null,
  'Holidays last 92 days at most'
);
select throws_ok(
  $$ insert into public.vacations (child_id, from_date, to_date)
     values ('00000000-0000-4000-8000-0000000000c1', '2026-11-02', '2026-11-01') $$,
  '23514', null,
  'Holidays end on or after their first day'
);

-- Bob -----------------------------------------------------------------------------------------------

select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');

select is(
  (select count(*)::int from public.routines) + (select count(*)::int from public.vacations),
  0,
  'A parent reads no other family''s routines or holidays'
);
update public.routines set goal_value = 10 where child_id = '00000000-0000-4000-8000-0000000000c1';
delete from public.vacations where child_id = '00000000-0000-4000-8000-0000000000c1';

-- Léa's device --------------------------------------------------------------------------------------

select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);

select is(
  (select array_agg(goal_value)::int[] from public.routines),
  '{15}'::int[],
  'A device reads its child''s routine only, which another parent could not change'
);
select is(
  (select count(*)::int from public.vacations),
  1,
  'A device reads its child''s holidays, which another parent could not remove'
);
select throws_ok(
  $$ insert into public.vacations (child_id, from_date, to_date)
     values ('00000000-0000-4000-8000-0000000000c1', '2026-12-19', '2027-01-03') $$,
  '42501', null,
  'A device cannot add holidays'
);
update public.routines set goal_value = 10 where child_id = '00000000-0000-4000-8000-0000000000c1';
delete from public.routines;

-- Revoked device ------------------------------------------------------------------------------------

select pg_temp.as_user('00000000-0000-4000-8000-0000000000d2', true);

select is(
  (select count(*)::int from public.routines) + (select count(*)::int from public.vacations),
  0,
  'A revoked device reads no routine'
);

-- Alice again ---------------------------------------------------------------------------------------

select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');

select is(
  (select goal_value from public.routines where child_id = '00000000-0000-4000-8000-0000000000c1'),
  15::smallint,
  'A device cannot change or remove its routine'
);
select lives_ok(
  $$ update public.routines set goal_type = 'count', goal_value = 30
     where child_id = '00000000-0000-4000-8000-0000000000c3' $$,
  'A parent changes a routine'
);
select is(
  (select goal_value from public.routines where child_id = '00000000-0000-4000-8000-0000000000c3'),
  30::smallint,
  'The change is stored'
);

-- Day plan (server side) ------------------------------------------------------------------------

reset role;

select is(
  (select row(start_time, deadline_time)::text
   from private.day_plan('00000000-0000-4000-8000-0000000000c1', '2026-10-14')),
  row('14:00'::time, '20:30'::time)::text,
  'A Wednesday starts at the Wednesday time'
);
select is(
  (select start_time from private.day_plan('00000000-0000-4000-8000-0000000000c1', '2026-11-02')),
  '17:00'::time,
  'A Monday after the holidays starts at the usual time'
);
select is(
  (select count(*)::int from private.day_plan('00000000-0000-4000-8000-0000000000c1', '2026-10-18'))
  + (select count(*)::int
     from private.day_plan('00000000-0000-4000-8000-0000000000c1', '2026-10-17'))
  + (select count(*)::int
     from private.day_plan('00000000-0000-4000-8000-0000000000c2', '2026-10-14')),
  0,
  'Nothing is planned on a day off, during holidays or without a routine'
);

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select throws_ok(
  $$ select * from private.day_plan('00000000-0000-4000-8000-0000000000c1', '2026-10-14') $$,
  '42501', null,
  'Clients cannot call the day plan'
);

select * from finish();
rollback;
