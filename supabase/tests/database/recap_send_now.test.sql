-- A recap sent at once (private.send_recap_now), to check notifications, emails and the PDF on a
-- real account, and the real recap replacing it when the period ends. Run with
-- `pnpm supabase:test`.
--
-- Alice and Carla are Léa's parents (Carla wants the weekly email too); Bob is another family.
-- Léa played on Monday 14, Tuesday 15 and Wednesday 16 September 2026; the test runs on
-- Wednesday 16 at 18:00, Paris time.
begin;
create extension if not exists pgtap with schema extensions;
select plan(32);

insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'bob@example.com',
   '{"display_name": "Bob", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000a2', 'authenticated', 'authenticated', 'carla@example.com',
   '{}', false);

insert into public.parents (user_id, family_id, role, display_name, privacy_consent_at, privacy_consent_version)
select '00000000-0000-4000-8000-0000000000a2', p.family_id, 'co_parent', 'Carla', now(), '2026-10'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';

insert into public.children (id, family_id, display_name, gender, grade, created_at)
select child.id, p.family_id, child.name, 'girl', 'CM1', '2026-08-15'
from (values
  ('00000000-0000-4000-8000-0000000000c1'::uuid, 'Léa', '00000000-0000-4000-8000-0000000000a1'::uuid),
  ('00000000-0000-4000-8000-0000000000c2'::uuid, 'Tom', '00000000-0000-4000-8000-0000000000b1'::uuid)
) as child (id, name, user_id)
join public.parents p on p.user_id = child.user_id;

insert into public.routines (child_id, days, start_time, deadline_time, goal_type, goal_value, created_at)
values ('00000000-0000-4000-8000-0000000000c1', '{1,2,3,4,5}', '17:00', '20:30', 'duration', 15, '2026-08-20');

insert into public.sessions (
  id, child_id, kind, local_date, started_at, completed_at, goal_type, goal_value, answered, score,
  duration_s, goal_met, xp_awarded, awarded_at
)
select ('00000000-0000-4000-8000-1000000000' || day)::uuid,
  '00000000-0000-4000-8000-0000000000c1', 'daily', make_date(2026, 9, day),
  make_timestamptz(2026, 9, day, 17, 5, 0, 'Europe/Paris'),
  make_timestamptz(2026, 9, day, 17, 20, 0, 'Europe/Paris'),
  'duration', 15, 10, 8, 900, true, 70, make_timestamptz(2026, 9, day, 17, 21, 0, 'Europe/Paris')
from generate_series(14, 16) as day;

insert into public.push_tokens (user_id, token, platform)
values
  ('00000000-0000-4000-8000-0000000000a1', 'ExponentPushToken[alice-phone]', 'ios'),
  ('00000000-0000-4000-8000-0000000000a2', 'ExponentPushToken[carla-phone]', 'android');

-- The Edge Function's address and key, as `pnpm supabase:cron-secrets` writes them: none at first.
delete from vault.secrets where name in ('project_url', 'service_role_key');

create function pg_temp.send(kind public.recap_kind, previous boolean default false,
  at timestamptz default '2026-09-16 18:00+02') returns jsonb
language sql as $$
  select private.send_recap_now('alice@example.com', kind, previous, at);
$$;

create function pg_temp.recap(which public.recap_kind, starts date) returns public.recaps
language sql as $$
  select * from public.recaps
  where child_id = '00000000-0000-4000-8000-0000000000c1' and kind = which and period_start = starts;
$$;

create function pg_temp.emails_to(which public.recap_kind, starts date) returns text[]
language sql as $$
  select coalesce(array_agg(x ->> 'email' order by x ->> 'email'), '{}')
  from jsonb_array_elements(
    public.recap_delivery((pg_temp.recap(which, starts)).id) -> 'recipients') x;
$$;

create function pg_temp.notified(which public.recap_kind) returns text[]
language sql as $$
  select coalesce(array_agg(u.email::text order by n.created_at, u.email::text), '{}')
  from public.notifications n join auth.users u on u.id = n.recipient_id
  where n.kind = (which::text || '_recap')::public.notification_kind;
$$;

create function pg_temp.alice() returns uuid language sql as $$
  select id from public.parents where display_name = 'Alice';
$$;

-- The week so far ----------------------------------------------------------------------------------

select throws_ok(
  $$ select private.send_recap_now('nobody@example.com', 'weekly') $$,
  'PT404', 'parent_not_found',
  'An unknown email is said so'
);

select is(
  private.send_recap_now(' ALICE@example.com', 'weekly', false, '2026-09-16 18:00+02'),
  '{"parent": "Alice", "kind": "weekly",
    "recaps": [{"child": "Léa", "from": "2026-09-14", "to": "2026-09-20", "sessions": 3}],
    "skipped": [], "notification": "sent", "phones": 1, "email": "no_vault_secrets",
    "email_to": "alice@example.com"}'::jsonb,
  'The week so far, for each child of the family; without the Vault secrets, no email can go'
);
select is(
  (pg_temp.recap('weekly', '2026-09-14')).content,
  private.weekly_recap('00000000-0000-4000-8000-0000000000c1', '2026-09-14', '2026-09-16 18:00+02'),
  'The real recap''s content, as of now'
);
select is(
  (pg_temp.recap('weekly', '2026-09-14')).test_parent_id,
  pg_temp.alice(),
  'Marked as a test, for Alice'
);
select is(
  (select array[n.title, n.url, n.push_tokens[1], n.sent_at::text]
   from public.notifications n where n.kind = 'weekly_recap'),
  array['Récap de la semaine', '/parent/children/00000000-0000-4000-8000-0000000000c1/progress',
    'ExponentPushToken[alice-phone]', '2026-09-16 16:00:00+00'],
  'The notification goes to Alice''s phone at once'
);
select is(pg_temp.notified('weekly'), array['alice@example.com'], 'Carla gets nothing');
select is(
  pg_temp.emails_to('weekly', '2026-09-14'),
  array['alice@example.com'],
  'The email goes to Alice only, although Carla wants the weekly recap'
);
select is(
  (select jsonb_agg(r ->> 'id') from jsonb_array_elements(public.recaps_to_deliver(20, '2026-09-16 18:05+02')) r),
  jsonb_build_array((pg_temp.recap('weekly', '2026-09-14')).id),
  'It waits for the Edge Function like a real recap'
);
select is(
  (select count(*)::integer from public.recaps where child_id = '00000000-0000-4000-8000-0000000000c2'),
  0,
  'Another family''s children are left alone'
);

-- Again, once delivered: replaced, sent again.
select public.recap_email_result((pg_temp.recap('weekly', '2026-09-14')).id, pg_temp.alice(), 'resend-1');
select public.recap_done((pg_temp.recap('weekly', '2026-09-14')).id);
select is(pg_temp.emails_to('weekly', '2026-09-14'), '{}'::text[], 'Delivered');

select vault.create_secret('http://127.0.0.1:54321', 'project_url');
select vault.create_secret('service-key', 'service_role_key');
select is(
  pg_temp.send('weekly', false, '2026-09-16 19:00+02') -> 'email',
  '"requested"'::jsonb,
  'With the Vault secrets, the Edge Function is asked to send the email'
);
select is(
  (select count(*)::integer from public.recaps where kind = 'weekly'),
  1,
  'The test of the same period replaces the last one'
);
select is(
  (select array[r.delivered_at::text, r.attempts::text, r.created_at::text]
   from pg_temp.recap('weekly', '2026-09-14') r),
  array[null, '0', '2026-09-16 17:00:00+00'],
  'and is delivered again'
);
select is(pg_temp.emails_to('weekly', '2026-09-14'), array['alice@example.com'], 'Its email goes again');
select is(pg_temp.notified('weekly'), array['alice@example.com', 'alice@example.com'], 'So does its notification');

-- The settings, the last week and the month ------------------------------------------------------------

update public.recap_preferences set weekly_push = false, weekly_email = false
where parent_id = pg_temp.alice();
select is(
  pg_temp.send('weekly') - array['recaps', 'phones', 'email_to'],
  '{"parent": "Alice", "kind": "weekly", "skipped": [], "notification": "turned_off",
    "email": "turned_off"}'::jsonb,
  'Alice''s settings apply'
);
select is(pg_temp.notified('weekly'), array['alice@example.com', 'alice@example.com'], 'No notification');
select is(pg_temp.emails_to('weekly', '2026-09-14'), '{}'::text[], 'No email');
update public.recap_preferences set weekly_push = true, weekly_email = true
where parent_id = pg_temp.alice();

select is(
  pg_temp.send('weekly', true) -> 'recaps',
  '[{"child": "Léa", "from": "2026-09-07", "to": "2026-09-13", "sessions": 0}]'::jsonb,
  'Or the last week'
);
select is(
  pg_temp.send('monthly') -> 'recaps',
  '[{"child": "Léa", "from": "2026-09-01", "to": "2026-09-30", "sessions": 3}]'::jsonb,
  'The month so far'
);
select is(
  (pg_temp.recap('monthly', '2026-09-01')).content,
  private.monthly_recap('00000000-0000-4000-8000-0000000000c1', '2026-09-01', '2026-09-16 18:00+02'),
  'with the real recap''s content'
);
select is(
  pg_temp.send('monthly', true) -> 'recaps',
  '[{"child": "Léa", "from": "2026-08-01", "to": "2026-08-31", "sessions": 0}]'::jsonb,
  'Or the last month'
);
select is(pg_temp.notified('monthly'), array['alice@example.com', 'alice@example.com'], 'Each notified');

-- The real recaps replace the tests ---------------------------------------------------------------------

select public.recap_email_result((pg_temp.recap('weekly', '2026-09-14')).id, pg_temp.alice(), 'resend-2');
select public.recap_save((pg_temp.recap('monthly', '2026-09-01')).id,
  '{"source": "standard", "tips": ["a", "b", "c"]}', 'family/child/2026-09.pdf');
select is(private.enqueue_recaps('2026-09-20 19:00+02'), 1, 'On Sunday at 19:00, the real week');
select is(
  (select array[r.test_parent_id::text, r.delivered_at::text, r.created_at::text]
   from pg_temp.recap('weekly', '2026-09-14') r),
  array[null, null, '2026-09-20 17:00:00+00'],
  'replaces the test'
);
select is(
  (pg_temp.recap('weekly', '2026-09-14')).content,
  private.weekly_recap('00000000-0000-4000-8000-0000000000c1', '2026-09-14', '2026-09-20 19:00+02'),
  'with the whole week'
);
select is(
  pg_temp.emails_to('weekly', '2026-09-14'),
  array['alice@example.com', 'carla@example.com'],
  'and goes to both parents, Alice again'
);
select is(
  pg_temp.notified('weekly'),
  array['alice@example.com', 'alice@example.com', 'alice@example.com', 'alice@example.com',
    'carla@example.com'],
  'Both are notified (after Alice''s tests, the last week''s included)'
);

select is(
  pg_temp.send('weekly', false, '2026-09-20 20:00+02') - array['phones', 'email_to'],
  '{"parent": "Alice", "kind": "weekly", "recaps": [],
    "skipped": [{"child": "Léa", "from": "2026-09-14", "reason": "real_recap_exists"}],
    "notification": "nothing_to_send", "email": "nothing_to_send"}'::jsonb,
  'A test never touches a real recap'
);

select is(private.enqueue_recaps('2026-10-01 09:00+02'), 1, 'On the 1st, the real month');
select is(
  (select array[r.test_parent_id::text, r.advice::text, r.pdf_path, r.created_at::text]
   from pg_temp.recap('monthly', '2026-09-01') r),
  array[null, null, null, '2026-10-01 07:00:00+00'],
  'replaces the test: new tips, new PDF'
);

-- Only the database's owner sends one ------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-0000000000a1", "role": "authenticated"}', true);
select throws_ok(
  $$ select private.send_recap_now('alice@example.com', 'weekly') $$,
  '42501', null,
  'Not from the app'
);
reset role;

select * from finish();
rollback;
