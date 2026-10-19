-- The child's look (phase 6): theme, hero and cosmetics, checked by the database. Run with
-- `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

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

create function pg_temp.look(hero text default 'juno', wear jsonb default '{}')
returns jsonb language sql as $$
  select jsonb_build_object('hero', hero, 'wear', wear);
$$;

create function pg_temp.lea() returns text
language sql security definer as $$
  select theme_id || ' ' || (avatar ->> 'hero') || ' ' || coalesce(avatar #>> '{wear,aura}', '-')
  from public.children where id = '00000000-0000-4000-8000-0000000000c1';
$$;

-- Avatars ------------------------------------------------------------------------------------

select ok(private.valid_avatar(pg_temp.look()), 'An avatar names a hero');
select ok(
  private.valid_avatar(pg_temp.look(wear => '{"aura": "aura-pink", "frame": "frame-stars"}')),
  'and a cosmetic in the slots it uses'
);
select ok(not private.valid_avatar(pg_temp.look(hero => 'pikachu')), 'An unknown hero is refused');
select ok(not private.valid_avatar(pg_temp.look() - 'wear'), 'and so is an avatar without wear');
select ok(not private.valid_avatar(pg_temp.look() || '{"skin": "skin-1"}'), 'or with another key');
select ok(
  not private.valid_avatar(pg_temp.look(wear => '{"frame": "aura-pink"}')),
  'A cosmetic cannot go in another slot'
);
select ok(
  not private.valid_avatar(pg_temp.look(wear => '{"aura": "aura-plasma"}')),
  'nor can an unknown one'
);
select is(
  private.default_avatar('boy'),
  '{"hero": "kai", "wear": {"frame": "frame-neon"}}',
  'Before choosing, a boy is Kai and a girl Nova, as in packages/shared/src/avatar.ts'
);

-- As Alice (the parent) -------------------------------------------------------------------------

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
insert into public.children (family_id, display_name, gender, grade)
select family_id, 'Noé', 'boy', 'CM1' from public.parents
where user_id = '00000000-0000-4000-8000-0000000000a1';
select is(
  (select theme_id || ' ' || avatar::text from public.children where display_name = 'Noé'),
  'neon {}',
  'A new child takes the Neon Stage theme, the hero still to choose'
);
select throws_ok(
  $$update public.children set theme_id = 'pirates'
    where id = '00000000-0000-4000-8000-0000000000c1'$$,
  '23514', null, 'An unknown theme is refused'
);
select throws_ok(
  $$update public.children set avatar = '{"hero": "nova"}'
    where id = '00000000-0000-4000-8000-0000000000c1'$$,
  '23514', null, 'and an incomplete avatar'
);

-- As Léa's device -------------------------------------------------------------------------------

select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select lives_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'manga',
    pg_temp.look('mika', '{"aura": "aura-pink"}'))$$,
  'Léa''s device sets her theme, her hero and a free aura'
);
select is(pg_temp.lea(), 'manga mika aura-pink', 'which are kept');
select throws_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'manga',
    pg_temp.look('mika', '{"aura": "aura-gold"}'))$$,
  'PT403', 'avatar_locked', 'The golden aura needs its badge (7 days of streak)'
);
select throws_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'manga',
    pg_temp.look('mika', '{"companion": "dragon"}'))$$,
  'PT403', 'avatar_locked', 'and Draco must be bought first'
);
reset role;
insert into public.child_badges (child_id, badge_code, earned_at)
values ('00000000-0000-4000-8000-0000000000c1', 'streak-7', now());
insert into public.child_items (child_id, item_code, bought_at)
values ('00000000-0000-4000-8000-0000000000c1', 'dragon', now());
set local role authenticated;
select lives_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'neon',
    pg_temp.look('mika', '{"aura": "aura-gold", "companion": "dragon"}'))$$,
  'Once the badge earned and Draco bought, Léa wears both'
);
select is(pg_temp.lea(), 'neon mika aura-gold', 'in the Neon Stage theme');
select throws_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'pirates',
    pg_temp.look())$$,
  'PT400', 'invalid_theme', 'An unknown theme is refused'
);
select throws_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'neon',
    pg_temp.look(hero => 'pikachu'))$$,
  'PT400', 'invalid_avatar', 'and an unknown hero'
);

-- As Bob -------------------------------------------------------------------------------------------

select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select throws_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'manga',
    pg_temp.look())$$,
  'PT404', 'child_not_found', 'Bob cannot change Léa''s look'
);
select is(pg_temp.lea(), 'neon mika aura-gold', 'which stays as she chose');

select * from finish();
rollback;
