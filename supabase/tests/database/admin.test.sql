-- Phase 7c: the back-office's roles, its change log, and what each role may edit.
-- Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Sam (super-admin), Eva (editor), Mo (moderator) have no family; Alice is a parent with Léa (CM1,
-- personalization on) and Léa's device.
insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000f1', 'authenticated', 'authenticated', 'sam@team.example', '{}', false),
  ('00000000-0000-4000-8000-0000000000f2', 'authenticated', 'authenticated', 'eva@team.example', '{}', false),
  ('00000000-0000-4000-8000-0000000000f3', 'authenticated', 'authenticated', 'mo@team.example', '{}', false),
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', null, '{}', true);

insert into public.children (id, family_id, display_name, gender, grade, personalization_consent_at,
  personalization_consent_version)
select '00000000-0000-4000-8000-0000000000c1', p.family_id, 'Léa', 'girl', 'CM1', now(), '2026-10'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';
insert into public.devices (id, user_id, family_id, platform)
select '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000d1', p.family_id, 'ios'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';
insert into public.device_children (device_id, child_id)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1');
insert into public.interest_other_answers (child_id, question_id, answer)
values ('00000000-0000-4000-8000-0000000000c1', 'games', 'Zelda');
insert into public.child_interests (child_id, universe_id, question_id, source)
values ('00000000-0000-4000-8000-0000000000c1', 'minecraft', 'games', 'questionnaire');

select is(
  (select count(*)::int from public.families f join public.parents p on p.family_id = f.id
   join auth.users u on u.id = p.user_id where u.email like '%@team.example'),
  0,
  'Team accounts get no family'
);

select private.grant_admin('SAM@team.example', 'super_admin');
select private.grant_admin('eva@team.example', 'editor');
select private.grant_admin('mo@team.example', 'moderator');

create function pg_temp.as_user(id text, anonymous boolean default false) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object(
    'sub', id, 'role', 'authenticated', 'is_anonymous', anonymous)::text, true);
$$;

set local role authenticated;

-- The parent ---------------------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select is(public.admin_whoami(), null, 'A parent has no role in the back-office');
select is((select count(*)::int from public.admin_users), 0, 'A parent does not see the team');
select throws_ok(
  $$ insert into public.universes (id, name, category, grades, review_at)
     values ('zelda', 'Zelda', 'game', '{CM1}', '2027-01-20') $$,
  '42501', null,
  'A parent cannot add a universe'
);
select is((select count(*)::int from public.admin_other_answers()), 0, 'A parent reads no « Autre » answer');

-- The moderator ------------------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-4000-8000-0000000000f3');
select is(public.admin_whoami(), 'moderator'::public.admin_role, 'The moderator knows their role');
select throws_ok(
  $$ insert into public.universes (id, name, category, grades, review_at)
     values ('zelda', 'Zelda', 'game', '{CM1}', '2027-01-20') $$,
  '42501', null,
  'A moderator cannot add a universe'
);
select is(
  (select answer || ' ' || grade_band from public.admin_other_answers()),
  'Zelda cm1-cm2',
  'A moderator reads the « Autre » answers, with their age group and not the child'
);
select lives_ok(
  $$ select public.admin_review_other((select id from public.interest_other_answers limit 1), 'approved') $$,
  'A moderator approves an « Autre » answer'
);
select throws_ok(
  $$ select public.admin_set_role('eva@team.example', 'moderator') $$,
  'PT403', 'admin_only',
  'Only the super-admin gives roles'
);

-- The editor adds a trend: the app offers it at once ----------------------------------------------
select pg_temp.as_user('00000000-0000-4000-8000-0000000000f2');
insert into public.universes (id, name, category, grades, pegi, vocabulary, review_at)
values ('zelda', 'Zelda', 'game', '{CM1,CM2}', 12, '{"words": ["rubis", "épée"]}', '2027-01-20');
insert into public.interest_options (question_id, universe_id, icon, position)
values ('games', 'zelda', '🗡️', 20);
update public.universes set status = 'retired' where id = 'roblox';
select is(
  (select count(*)::int from public.universes where id = 'roblox'),
  1,
  'An editor still reads a retired universe'
);
select is(
  (select children from public.admin_interest_counts() where universe_id = 'minecraft'),
  1,
  'An editor reads how many children chose each universe'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select is(
  (select string_agg(u.name, ', ' order by o.position) from public.interest_options o
   join public.universes u on u.id = o.universe_id
   where o.question_id = 'games' and u.id in ('zelda', 'roblox')),
  'Zelda',
  'The child''s questionnaire offers the new trend, and no longer the retired one'
);
select is(
  public.set_child_interests('00000000-0000-4000-8000-0000000000c1',
    '[{"question": "games", "universes": ["minecraft", "zelda"]}]'),
  2,
  'The child chooses the new trend without any update of the app'
);

-- The super-admin ----------------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-4000-8000-0000000000f1');
select is(
  (select string_agg(email || ':' || role, ', ' order by email) from public.admin_team()),
  'eva@team.example:editor, mo@team.example:moderator, sam@team.example:super_admin',
  'The super-admin sees the team with their emails'
);
select lives_ok(
  $$ select public.admin_set_role('mo@team.example', 'editor') $$,
  'The super-admin changes a role'
);
select throws_ok(
  $$ select public.admin_set_role('sam@team.example', null) $$,
  'PT409', 'own_role',
  'The super-admin cannot remove their own role'
);
select is(
  (select string_agg(entity || ':' || action, ', ' order by at, entity)
   from public.admin_audit_log
   where admin_id = '00000000-0000-4000-8000-0000000000f2'),
  'interest_options:insert, universes:insert, universes:update',
  'Every change of the editor is logged'
);
select ok(
  (select before ->> 'status' = 'active' and after ->> 'status' = 'retired'
   from public.admin_audit_log where entity = 'universes' and action = 'update'),
  'The log keeps the row before and after'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000f2');
select is((select count(*)::int from public.admin_audit_log), 0, 'Only the super-admin reads the log');

select * from finish();
rollback;
