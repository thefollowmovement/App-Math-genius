-- RLS and pairing rules for families, children and devices. Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

-- Two parents in two families, and two anonymous child devices.
insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'bob@example.com',
   '{"display_name": "Bob", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', null, '{}', true),
  ('00000000-0000-4000-8000-0000000000d2', 'authenticated', 'authenticated', null, '{}', true);

-- Sign-up trigger ----------------------------------------------------------------------------------

select is(
  (select count(*)::int from public.parents),
  2,
  'Each parent sign-up creates one parent; anonymous devices create none'
);
select isnt(
  (select family_id from public.parents where user_id = '00000000-0000-4000-8000-0000000000a1'),
  (select family_id from public.parents where user_id = '00000000-0000-4000-8000-0000000000b1'),
  'Each parent gets their own family'
);
select ok(
  (select privacy_consent_at is not null and privacy_consent_version = '2026-10' and role = 'owner'
   from public.parents where user_id = '00000000-0000-4000-8000-0000000000a1'),
  'The parent owns the family and their consent is timestamped'
);

-- Bob's child, created directly.
insert into public.children (id, family_id, display_name, gender, grade)
select '00000000-0000-4000-8000-0000000000c2', family_id, 'Tom', 'boy', 'CM1'
from public.parents where user_id = '00000000-0000-4000-8000-0000000000b1';

select set_config('test.bob_family',
  (select family_id::text from public.parents where user_id = '00000000-0000-4000-8000-0000000000b1'), true);

-- Alice --------------------------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000a1", "role": "authenticated", "is_anonymous": false}', true);

select lives_ok(
  $$ insert into public.children (id, family_id, display_name, gender, grade)
     select '00000000-0000-4000-8000-0000000000c1', family_id, 'Léa', 'girl', 'CE2'
     from public.parents where user_id = auth.uid() $$,
  'A parent adds a child to their family'
);
select throws_ok(
  $$ insert into public.children (family_id, display_name, gender, grade)
     values (current_setting('test.bob_family')::uuid, 'Intrus', 'boy', 'CP') $$,
  '42501',
  null,
  'A parent cannot add a child to another family'
);
select is((select count(*)::int from public.children), 1, 'A parent sees only their children');
select is((select count(*)::int from public.families), 1, 'A parent sees only their family');
select is((select count(*)::int from public.parents), 1, 'A parent sees only their family''s parents');

select ok(
  (select code ~ '^[A-HJ-NP-Z2-9]{6}$' and expires_at between now() + interval '9 minutes' and now() + interval '11 minutes'
   from public.create_pairing_code('00000000-0000-4000-8000-0000000000c1')),
  'A pairing code has 6 unambiguous characters and lasts 10 minutes'
);
select set_config('test.code',
  (select code from public.create_pairing_code('00000000-0000-4000-8000-0000000000c1')), true);
select is(
  (select count(*)::int from public.pairing_codes where used_at is null),
  1,
  'A new code replaces the child''s previous unused code'
);
select throws_ok(
  $$ select public.create_pairing_code('00000000-0000-4000-8000-0000000000c2') $$,
  'PT404',
  'child_not_found',
  'A parent cannot create a code for another family''s child'
);
select throws_ok(
  format($$ select public.redeem_pairing_code(%L, 'ios') $$, current_setting('test.code')),
  'PT403',
  'device_session_required',
  'A parent account cannot redeem a pairing code'
);

-- Bob ----------------------------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000b1", "role": "authenticated", "is_anonymous": false}', true);

select is(
  (select count(*)::int from public.children where id = '00000000-0000-4000-8000-0000000000c1'),
  0,
  'Another parent cannot see the child'
);
select is((select count(*)::int from public.pairing_codes), 0, 'Another parent cannot see the codes');
select is_empty(
  $$ update public.children set display_name = 'Pirate'
     where id = '00000000-0000-4000-8000-0000000000c1' returning id $$,
  'Another parent cannot rename the child'
);

-- Device A -----------------------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000d1", "role": "authenticated", "is_anonymous": true}', true);

select is((select count(*)::int from public.children), 0, 'An unpaired device sees no child');
select throws_ok(
  $$ select public.redeem_pairing_code('ZZZZZZ', 'ios') $$,
  'PT400',
  'invalid_pairing_code',
  'A wrong code is rejected'
);
select is(
  (select display_name from public.redeem_pairing_code(lower(current_setting('test.code')), 'ios')),
  'Léa',
  'A device redeems a valid code (case-insensitive) and learns which child it got'
);
select is(
  (select array_agg(display_name) from public.children),
  array['Léa'],
  'A paired device sees its child only'
);
select is((select count(*)::int from public.families), 0, 'A device cannot read families');
select is((select count(*)::int from public.parents), 0, 'A device cannot read parents');
select throws_ok(
  $$ insert into public.children (family_id, display_name, gender, grade)
     select family_id, 'Bis', 'girl', 'CP' from public.children $$,
  '42501',
  null,
  'A device cannot add children'
);

-- Device B -----------------------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000d2", "role": "authenticated", "is_anonymous": true}', true);

select throws_ok(
  format($$ select public.redeem_pairing_code(%L, 'android') $$, current_setting('test.code')),
  'PT400',
  'invalid_pairing_code',
  'A code works only once'
);

reset role;
select set_config('test.device_a',
  (select id::text from public.devices where user_id = '00000000-0000-4000-8000-0000000000d1'), true);
insert into public.pairing_codes (family_id, child_id, code, expires_at, created_by)
select p.family_id, '00000000-0000-4000-8000-0000000000c1', 'EXPRDA', now() - interval '1 second', p.id
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';
insert into public.pairing_codes (family_id, child_id, code, expires_at, created_by)
select p.family_id, '00000000-0000-4000-8000-0000000000c2', 'BQBTQM', now() + interval '10 minutes', p.id
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000b1';
insert into public.pairing_codes (family_id, child_id, code, expires_at, created_by)
select p.family_id, '00000000-0000-4000-8000-0000000000c1', 'ALCLEA', now() + interval '10 minutes', p.id
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';
set local role authenticated;

select throws_ok(
  $$ select public.redeem_pairing_code('EXPRDA', 'android') $$,
  'PT400',
  'invalid_pairing_code',
  'An expired code is rejected'
);
select lives_ok(
  $$ select public.redeem_pairing_code('BQBTQM', 'android') $$,
  'Device B pairs with Bob''s child'
);
select throws_ok(
  $$ select public.redeem_pairing_code('ALCLEA', 'android') $$,
  'PT409',
  'device_in_other_family',
  'A device paired to one family cannot join another'
);

-- Revocation ---------------------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000b1", "role": "authenticated", "is_anonymous": false}', true);
select throws_ok(
  $$ select public.revoke_device(current_setting('test.device_a')::uuid) $$,
  'PT404',
  'device_not_found',
  'A parent cannot revoke another family''s device'
);

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000a1", "role": "authenticated", "is_anonymous": false}', true);
select is((select count(*)::int from public.devices), 1, 'A parent sees their family''s devices only');
select lives_ok(
  $$ select public.revoke_device((select id from public.devices)) $$,
  'A parent revokes their child''s device'
);

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000d1", "role": "authenticated", "is_anonymous": true}', true);
select is((select count(*)::int from public.children), 0, 'A revoked device loses access to the child');
select ok(
  (select revoked_at is not null from public.devices),
  'A revoked device can still see that it was revoked'
);

select * from finish();
rollback;
