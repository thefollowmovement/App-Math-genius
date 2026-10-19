-- The illustrated companions (phase 6f): the catalog, cosmetics kept without their condition, the
-- first-exercise badge and refunds. Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

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

create function pg_temp.with_companion(companion text) returns jsonb
language sql as $$
  select jsonb_build_object('hero', 'nova', 'wear', jsonb_build_object('companion', companion));
$$;

-- A session of Léa's, with `answers` answered exercises, awarded or not.
create function pg_temp.play(answers int, awarded boolean) returns void
language sql as $$
  with session as (
    insert into public.sessions (
      id, child_id, kind, local_date, started_at, completed_at, goal_type, goal_value, answered,
      score, duration_s, goal_met, awarded_at
    )
    values (
      gen_random_uuid(), '00000000-0000-4000-8000-0000000000c1', 'daily', '2026-10-05',
      '2026-10-05 17:00+02', '2026-10-05 17:05+02', 'duration', 15, answers, 0, 300, false,
      case when awarded then now() end
    )
    returning id
  )
  insert into public.attempts (
    session_id, child_id, position, skill_code, generator_id, difficulty, seed, slot, answer,
    is_correct, time_ms, answered_at, learner_elo
  )
  select session.id, '00000000-0000-4000-8000-0000000000c1', i, 'ce2.tables-multiplication',
    'ce2.tables-multiplication', 2, i, 'current', '{"type": "numeric", "text": "0"}', false,
    5000, '2026-10-05 17:01+02', 1000
  from session, generate_series(0, answers - 1) as i;
$$;

-- Catalog ------------------------------------------------------------------------------------------

select is(
  (select array_agg(code || ' ' || price_gems order by position) from public.shop_items
   where kind = 'companion'),
  '{"lapin 80","dragon 120","licorne 150","renard 250"}',
  'The shop sells Lapin Street, Draco, the Licorne de Cristal and Kitsune'
);
select is(
  (select array_agg(id order by id) from jsonb_object_keys(private.cosmetics()) id
   where private.cosmetics() -> id ->> 'slot' = 'companion'),
  '{chat,dragon,hibou,lapin,licorne,phenix,renard,tigre}',
  'Eight companions'
);
select ok(
  not private.valid_avatar(pg_temp.with_companion('kitten')),
  'The emoji companions are gone'
);

-- Kept cosmetics -----------------------------------------------------------------------------------

select ok(
  (select relrowsecurity from pg_class where oid = 'public.child_cosmetics'::regclass),
  'RLS is enabled on the cosmetics kept by children'
);
select throws_ok(
  $$insert into public.child_cosmetics (child_id, cosmetic_id, granted_at)
    values ('00000000-0000-4000-8000-0000000000c1', 'kitten', now())$$,
  '23514', null, 'Only a cosmetic of the catalog is kept'
);

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select throws_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'neon',
    pg_temp.with_companion('chat'))$$,
  'PT403', 'avatar_locked', 'The Chaton Cosmique waits for the second island'
);
select throws_ok(
  $$insert into public.child_cosmetics (child_id, cosmetic_id, granted_at)
    values ('00000000-0000-4000-8000-0000000000c1', 'chat', now())$$,
  '42501', null, 'and Léa''s device cannot give it to her'
);

-- Léa had bought the kitten before the companions: she keeps the Chaton Cosmique.
reset role;
insert into public.child_cosmetics (child_id, cosmetic_id, granted_at)
values ('00000000-0000-4000-8000-0000000000c1', 'chat', now());
set local role authenticated;
select lives_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'neon',
    pg_temp.with_companion('chat'))$$,
  'A kept companion is worn without its badge'
);
select is(
  (select count(*)::int from public.child_cosmetics),
  1,
  'Léa''s device reads what she keeps'
);
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.child_cosmetics), 1, 'and so does Alice');
select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select is((select count(*)::int from public.child_cosmetics), 0, 'but not Bob');
select throws_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c2', 'neon',
    pg_temp.with_companion('chat'))$$,
  'PT403', 'avatar_locked', 'whose Tom has not kept it'
);
reset role;

-- The first exercise --------------------------------------------------------------------------------

select is(
  private.badge_metrics('00000000-0000-4000-8000-0000000000c1') -> 'exercises_done',
  '0',
  'Before any session, no exercise is done'
);
select pg_temp.play(3, true);
select pg_temp.play(2, false);
select is(
  private.badge_metrics('00000000-0000-4000-8000-0000000000c1') -> 'exercises_done',
  '3',
  'Exercises answered count once their session is awarded, right or wrong'
);
select is(
  private.grant_badges('00000000-0000-4000-8000-0000000000c1', null, now()),
  '{first-exercise}',
  'and the first one earns the badge of the Chouette Galactique'
);

-- Refunds ---------------------------------------------------------------------------------------------

insert into public.gem_transactions (child_id, amount, reason, ref_id, local_date) values
  ('00000000-0000-4000-8000-0000000000c1', 100, 'chest', gen_random_uuid(), '2026-10-05'),
  ('00000000-0000-4000-8000-0000000000c1', 60, 'refund', gen_random_uuid(), '2026-10-05');
select is(
  private.badge_metrics('00000000-0000-4000-8000-0000000000c1') -> 'gems_earned',
  '100',
  'Gems refunded are not earned'
);

select * from finish();
rollback;
