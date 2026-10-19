-- The shop (phase 5): items bought with gems, one worn per kind. Run with `pnpm supabase:test`.
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
select child.id, p.family_id, child.name, 'girl', 'CM1'
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

-- Léa opened chests worth 100 gems.
create function pg_temp.give_gems(amount int) returns void
language sql security definer as $$
  insert into public.gem_transactions (child_id, amount, reason, ref_id, local_date)
  values ('00000000-0000-4000-8000-0000000000c1', amount, 'chest', gen_random_uuid(), current_date);
$$;
select pg_temp.give_gems(100);

create function pg_temp.worn() returns text[]
language sql security definer as $$
  select coalesce(array_agg(item_code order by item_code), '{}') from public.child_items
  where child_id = '00000000-0000-4000-8000-0000000000c1' and equipped;
$$;

select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.shop_items'::regclass, 'public.child_items'::regclass)),
  'RLS is enabled on the shop and the children''s items'
);
select is((select count(*)::int from public.shop_items), 16, 'The shop sells 16 items');

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);

select is(
  public.buy_item('00000000-0000-4000-8000-0000000000c1', 'kitten'),
  '{"item_code": "kitten", "total_gems": 40}',
  'Léa''s device buys the kitten for 60 gems'
);
select is(pg_temp.worn(), '{kitten}', 'and she wears it');
select throws_ok(
  $$select public.buy_item('00000000-0000-4000-8000-0000000000c1', 'kitten')$$,
  'PT409', 'already_owned', 'An item is bought once'
);
select throws_ok(
  $$select public.buy_item('00000000-0000-4000-8000-0000000000c1', 'panda')$$,
  'PT409', 'not_enough_gems', 'The panda costs 100 gems: not enough left'
);
select is(
  public.buy_item('00000000-0000-4000-8000-0000000000c1', 'bow') ->> 'total_gems',
  '10',
  'The bow costs 30'
);
select is(pg_temp.worn(), '{bow,kitten}', 'One item of each kind is worn');

select pg_temp.give_gems(50);
select is(
  public.buy_item('00000000-0000-4000-8000-0000000000c1', 'cap') ->> 'total_gems',
  '30',
  'With 50 more gems, the cap'
);
select is(pg_temp.worn(), '{cap,kitten}', 'The new accessory replaces the bow');

select public.equip_item('00000000-0000-4000-8000-0000000000c1', 'bow', true);
select is(pg_temp.worn(), '{bow,kitten}', 'She wears the bow again');
select public.equip_item('00000000-0000-4000-8000-0000000000c1', 'bow', false);
select is(pg_temp.worn(), '{kitten}', 'and takes it off');
select throws_ok(
  $$select public.equip_item('00000000-0000-4000-8000-0000000000c1', 'panda', true)$$,
  'PT404', 'item_not_owned', 'An item not bought cannot be worn'
);
select throws_ok(
  $$select public.buy_item('00000000-0000-4000-8000-0000000000c1', 'spaceship')$$,
  'PT404', 'item_not_found', 'An unknown item cannot be bought'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select is(
  (select count(*)::int from public.child_items),
  3,
  'Alice reads Léa''s items'
);
select is(
  (select sum(amount)::int from public.gem_transactions
   where child_id = '00000000-0000-4000-8000-0000000000c1' and reason = 'shop'),
  -120,
  'and the gems they cost'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select is((select count(*)::int from public.child_items), 0, 'Bob reads none of them');
select throws_ok(
  $$select public.buy_item('00000000-0000-4000-8000-0000000000c1', 'fox')$$,
  'PT404', 'child_not_found', 'nor buys for Léa'
);

set local role anon;
select throws_ok(
  $$select public.buy_item('00000000-0000-4000-8000-0000000000c1', 'fox')$$,
  '42501', null, 'A signed-out visitor cannot buy'
);

select * from finish();
rollback;
