-- Child devices report whether they can show notifications (phase 4). Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

-- Alice's family (Léa), Bob's family, Léa's device and a revoked device.
insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'bob@example.com',
   '{"display_name": "Bob", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', null, '{}', true),
  ('00000000-0000-4000-8000-0000000000d2', 'authenticated', 'authenticated', null, '{}', true);

insert into public.devices (id, user_id, family_id, platform, revoked_at)
select device.id, device.user_id, p.family_id, 'android', device.revoked_at
from (values
  ('00000000-0000-4000-8000-0000000000e1'::uuid, '00000000-0000-4000-8000-0000000000d1'::uuid, null::timestamptz),
  ('00000000-0000-4000-8000-0000000000e2'::uuid, '00000000-0000-4000-8000-0000000000d2'::uuid, now())
) as device (id, user_id, revoked_at)
cross join public.parents p
where p.user_id = '00000000-0000-4000-8000-0000000000a1';

create function pg_temp.as_user(id text, anonymous boolean default false) returns void
language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', id, 'role', 'authenticated', 'is_anonymous', anonymous)::text, true);
$$;

set local role authenticated;

select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select ok(public.report_push_status('unsupported'), 'A paired device reports its push status');

select pg_temp.as_user('00000000-0000-4000-8000-0000000000d2', true);
select ok(not public.report_push_status('enabled'), 'A revoked device reports nothing');

select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select ok(not public.report_push_status('enabled'), 'A parent has no device status to report');
select is(
  (select count(*)::int from public.devices),
  0,
  'Nor do they read another family''s devices'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select is(
  (select array_agg(coalesce(push_status::text, 'unknown') order by id) from public.devices),
  '{unsupported,unknown}',
  'Parents read the push status of their family''s devices'
);

select * from finish();
rollback;
