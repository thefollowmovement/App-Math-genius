-- The heroes' outfits (phase 6g): one worn at a time, bought with gems or earned with the first
-- island. Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

-- Alice's family: Léa and her device.
insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', null, '{}', true);

insert into public.children (id, family_id, display_name, gender, grade)
select '00000000-0000-4000-8000-0000000000c1', p.family_id, 'Léa', 'girl', 'CE2'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';

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

create function pg_temp.dressed(outfit text) returns jsonb
language sql as $$
  select jsonb_build_object('hero', 'juno', 'wear', jsonb_build_object('outfit', outfit));
$$;

-- What Léa's hero wears, or 'stage' for her stage outfit.
create function pg_temp.outfit() returns text
language sql security definer as $$
  select coalesce(avatar #>> '{wear,outfit}', 'stage')
  from public.children where id = '00000000-0000-4000-8000-0000000000c1';
$$;

create function pg_temp.give_gems(amount int) returns void
language sql security definer as $$
  insert into public.gem_transactions (child_id, amount, reason, ref_id, local_date)
  values ('00000000-0000-4000-8000-0000000000c1', amount, 'chest', gen_random_uuid(), current_date);
$$;

-- Catalog -------------------------------------------------------------------------------------------

select is(
  (select array_agg(id order by id) from jsonb_object_keys(private.cosmetics()) id
   where private.cosmetics() -> id ->> 'slot' = 'outfit'),
  '{astronaute,magie,sport}',
  'Three outfits'
);
select is(
  (select array_agg(code || ' ' || price_gems order by position) from public.shop_items
   where kind = 'outfit'),
  '{"sport 100","magie 200"}',
  'The shop sells Sport for 100 gems and Magie for 200'
);
select ok(private.valid_avatar(pg_temp.dressed('sport')), 'An avatar wears an outfit');
select ok(
  not private.valid_avatar(pg_temp.dressed('chat')),
  'and nothing else in the outfit slot'
);

-- As Léa's device -----------------------------------------------------------------------------------

select pg_temp.give_gems(150);
set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);

select is(
  public.buy_item('00000000-0000-4000-8000-0000000000c1', 'sport') ->> 'total_gems',
  '50',
  'Léa buys the Sport outfit for 100 gems'
);
select is(pg_temp.outfit(), 'sport', 'and her hero wears it');
select throws_ok(
  $$select public.buy_item('00000000-0000-4000-8000-0000000000c1', 'magie')$$,
  'PT409', 'not_enough_gems', 'Magie costs 200 gems'
);
select throws_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'neon',
    pg_temp.dressed('astronaute'))$$,
  'PT403', 'avatar_locked', 'The astronaut waits for the first island'
);

reset role;
select pg_temp.give_gems(200);
insert into public.child_badges (child_id, badge_code, earned_at)
values ('00000000-0000-4000-8000-0000000000c1', 'island-1', now());
set local role authenticated;

select lives_ok(
  $$select public.set_child_look('00000000-0000-4000-8000-0000000000c1', 'neon',
    pg_temp.dressed('astronaute'))$$,
  'With the badge of the first island, Léa dresses her hero as an astronaut'
);
select is(pg_temp.outfit(), 'astronaute', 'one outfit at a time');
select public.buy_item('00000000-0000-4000-8000-0000000000c1', 'magie');
select is(pg_temp.outfit(), 'magie', 'Magie, bought, replaces it');
select public.equip_item('00000000-0000-4000-8000-0000000000c1', 'sport', true);
select is(pg_temp.outfit(), 'sport', 'She wears the Sport outfit again');
select public.equip_item('00000000-0000-4000-8000-0000000000c1', 'sport', false);
select is(pg_temp.outfit(), 'stage', 'and takes it off: back to her stage outfit');

select * from finish();
rollback;
