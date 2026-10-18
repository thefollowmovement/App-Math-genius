-- Rewards from the parent (phase 5): set by the parent, unlocked by the server, given by the
-- parent. Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

-- Alice's family (Léa and her device), Bob's family (Tom).
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

-- Léa finishes a daily session on `day` (9 right answers out of 10); returns the award.
create function pg_temp.day(day date) returns jsonb
language plpgsql security definer as $$
declare
  id uuid := gen_random_uuid();
begin
  insert into public.sessions (
    id, child_id, kind, local_date, started_at, completed_at, goal_type, goal_value, answered,
    score, duration_s, goal_met
  )
  values (
    id, '00000000-0000-4000-8000-0000000000c1', 'daily', day, day + time '17:00',
    day + time '17:15', 'count', 10, 10, 9, 900, true
  );
  insert into public.attempts (
    session_id, child_id, position, skill_code, generator_id, difficulty, seed, slot, answer,
    is_correct, time_ms, answered_at, learner_elo
  )
  select id, '00000000-0000-4000-8000-0000000000c1', i, 'ce2.tables-multiplication',
    'ce2.tables-multiplication', 2, i, 'current', '{"type": "numeric", "text": "0"}', i < 9,
    5000, day + time '17:00' + i * interval '1 minute', 1000
  from generate_series(0, 9) as i;
  return public.award_session(
    id,
    (select jsonb_agg(jsonb_build_object('position', i, 'correct', i < 9))
     from generate_series(0, 9) as i),
    (day + time '18:00') at time zone 'Europe/Paris'
  );
end;
$$;

create function pg_temp.status(reward_title text) returns text
language sql security definer as $$
  select case when given_at is not null then 'given' when unlocked_at is not null then 'unlocked'
    else 'locked' end
  from public.parent_rewards where title = reward_title;
$$;

select ok(
  (select relrowsecurity from pg_class where oid = 'public.parent_rewards'::regclass),
  'RLS is enabled on the parent''s rewards'
);

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select lives_ok(
  $$insert into public.parent_rewards (child_id, title, goal, target) values
    ('00000000-0000-4000-8000-0000000000c1', 'Une sortie au cinéma', 'streak', 3),
    ('00000000-0000-4000-8000-0000000000c1', 'Un livre', 'xp', 1000),
    ('00000000-0000-4000-8000-0000000000c1', 'Une glace', 'islands', 1)$$,
  'Alice sets rewards for Léa'
);
select is(pg_temp.status('Une sortie au cinéma'), 'locked', 'They start locked');
select throws_ok(
  $$insert into public.parent_rewards (child_id, title, goal, target, unlocked_at)
    values ('00000000-0000-4000-8000-0000000000c1', 'Tricher', 'xp', 10, now())$$,
  '42501', null, 'A parent cannot create a reward already unlocked'
);
select throws_ok(
  $$insert into public.parent_rewards (child_id, title, goal, target)
    values ('00000000-0000-4000-8000-0000000000c1', '  ', 'xp', 10)$$,
  '23514', null, 'A reward needs a title'
);
update public.parent_rewards set unlocked_at = now() where title = 'Un livre';
select is(pg_temp.status('Un livre'), 'locked', 'and cannot unlock one');
select throws_ok(
  $$select public.give_parent_reward(
    (select id from public.parent_rewards where title = 'Une sortie au cinéma'))$$,
  'PT409', 'reward_locked', 'A locked reward cannot be given'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select throws_ok(
  $$insert into public.parent_rewards (child_id, title, goal, target)
    values ('00000000-0000-4000-8000-0000000000c1', 'Un vélo', 'xp', 10)$$,
  '42501', null, 'Bob cannot set rewards for Léa'
);
select is((select count(*)::int from public.parent_rewards), 0, 'nor read hers');

select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select is((select count(*)::int from public.parent_rewards), 3, 'Léa''s device reads her rewards');
select throws_ok(
  $$insert into public.parent_rewards (child_id, title, goal, target)
    values ('00000000-0000-4000-8000-0000000000c1', 'Une console', 'xp', 10)$$,
  '42501', null, 'but cannot set one'
);
delete from public.parent_rewards where title = 'Une glace';
select is((select count(*)::int from public.parent_rewards), 3, 'nor remove one');

-- Three days of streak.
reset role;
select pg_temp.day('2026-10-05');
select is(pg_temp.day('2026-10-06') -> 'parent_rewards', null, 'Day 2: nothing unlocked yet');
select is(
  pg_temp.day('2026-10-07') -> 'parent_rewards' -> 0 ->> 'title',
  'Une sortie au cinéma',
  'Day 3: the award says the 3-day streak unlocked the cinema'
);
select is(pg_temp.status('Une sortie au cinéma'), 'unlocked', 'which is kept');

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
insert into public.parent_rewards (child_id, title, goal, target)
values ('00000000-0000-4000-8000-0000000000c1', 'Une crêpe', 'xp', 100);
select is(pg_temp.status('Une crêpe'), 'unlocked',
  'A reward whose goal is already reached unlocks as soon as it is set');

select public.give_parent_reward((select id from public.parent_rewards where title = 'Une crêpe'));
select is(pg_temp.status('Une crêpe'), 'given', 'Alice gives the crêpe');

select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select throws_ok(
  $$select public.give_parent_reward(
    (select id from public.parent_rewards where title = 'Une sortie au cinéma'))$$,
  'PT404', 'reward_not_found', 'Léa''s device cannot mark a reward given'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
delete from public.parent_rewards where title = 'Une glace';
select is((select count(*)::int from public.parent_rewards), 3, 'Alice removes a reward');

select * from finish();
rollback;
