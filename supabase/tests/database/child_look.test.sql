-- The child's look (phase 6): theme and avatar, checked by the database. Run with
-- `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

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

create function pg_temp.look(theme text default 'manga', outfit text default 'hoodie')
returns jsonb language sql as $$
  select jsonb_build_object('skin', 'skin-3', 'hair', 'curly', 'hairColor', 'red',
    'eyes', 'happy', 'outfit', outfit, 'outfitColor', 'green');
$$;

create function pg_temp.lea() returns text
language sql security definer as $$
  select theme_id || ' ' || (avatar ->> 'outfit') from public.children
  where id = '00000000-0000-4000-8000-0000000000c1';
$$;

-- Avatars ------------------------------------------------------------------------------------

select ok(private.valid_avatar(pg_temp.look()), 'An avatar names one option of every part');
select ok(not private.valid_avatar(pg_temp.look() - 'eyes'), 'none may be missing');
select ok(not private.valid_avatar(pg_temp.look() || '{"hat": "top"}'), 'nor added');
select ok(not private.valid_avatar(pg_temp.look() || '{"skin": "green"}'), 'nor unknown');
select ok(not private.valid_avatar(pg_temp.look() || '{"skin": 3}'), 'nor of another type');

-- As Alice (the parent) -------------------------------------------------------------------------

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select lives_ok(
  $$insert into public.children (family_id, display_name, gender, grade, theme_id)
    select family_id, 'Noé', 'boy', 'CM1', 'space' from public.parents
    where user_id = '00000000-0000-4000-8000-0000000000a1'$$,
  'A parent adds a child with the theme of the profile, the avatar still to choose'
);
select throws_ok(
  $$update public.children set theme_id = 'pirates'
    where id = '00000000-0000-4000-8000-0000000000c1'$$,
  '23514', null, 'An unknown theme is refused'
);
select throws_ok(
  $$update public.children set avatar = '{"skin": "skin-1"}'
    where id = '00000000-0000-4000-8000-0000000000c1'$$,
  '23514', null, 'and an incomplete avatar'
);

-- As Léa's device -------------------------------------------------------------------------------

select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select lives_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'manga',
    pg_temp.look())$$,
  'Léa''s device sets her theme and avatar'
);
select is(pg_temp.lea(), 'manga hoodie', 'which are kept');
select throws_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'manga',
    pg_temp.look(outfit => 'cape'))$$,
  'PT403', 'avatar_locked', 'The cape needs its badge (7 days of streak)'
);
reset role;
insert into public.child_badges (child_id, badge_code, earned_at)
values ('00000000-0000-4000-8000-0000000000c1', 'streak-7', now());
set local role authenticated;
select lives_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'space',
    pg_temp.look(outfit => 'cape'))$$,
  'Once earned, Léa wears it'
);
select is(pg_temp.lea(), 'space cape', 'in the space theme');
select throws_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'pirates',
    pg_temp.look())$$,
  'PT400', 'invalid_theme', 'An unknown theme is refused'
);
select throws_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'manga',
    pg_temp.look() - 'skin')$$,
  'PT400', 'invalid_avatar', 'and an incomplete avatar'
);

-- As Bob -------------------------------------------------------------------------------------------

select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select throws_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'manga',
    pg_temp.look())$$,
  'PT404', 'child_not_found', 'Bob cannot change Léa''s look'
);
select is(pg_temp.lea(), 'space cape', 'which stays as she chose');

select * from finish();
rollback;
