-- Reminders, parent alerts, push tokens and parent messages (phase 4), on a simulated clock.
-- Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(42);

-- Alice's family (Léa and Zoé), Bob's family (Tom), Léa's device and a revoked device.
insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'bob@example.com',
   '{"display_name": "Bob", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', null, '{}', true),
  ('00000000-0000-4000-8000-0000000000d2', 'authenticated', 'authenticated', null, '{}', true);

insert into public.children (id, family_id, display_name, gender, grade)
select child.id, p.family_id, child.name, 'girl', 'CE2'
from (values
  ('00000000-0000-4000-8000-0000000000c1'::uuid, 'Léa', 'alice@example.com'),
  ('00000000-0000-4000-8000-0000000000c3'::uuid, 'Zoé', 'alice@example.com'),
  ('00000000-0000-4000-8000-0000000000c2'::uuid, 'Tom', 'bob@example.com')
) as child (id, name, email)
join auth.users u on u.email = child.email
join public.parents p on p.user_id = u.id;

insert into public.devices (id, user_id, family_id, platform, revoked_at)
select device.id, device.user_id, p.family_id, 'ios', device.revoked_at
from (values
  ('00000000-0000-4000-8000-0000000000e1'::uuid, '00000000-0000-4000-8000-0000000000d1'::uuid, null::timestamptz),
  ('00000000-0000-4000-8000-0000000000e2'::uuid, '00000000-0000-4000-8000-0000000000d2'::uuid, now())
) as device (id, user_id, revoked_at)
cross join public.parents p
where p.user_id = '00000000-0000-4000-8000-0000000000a1';

insert into public.device_children (device_id, child_id)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1');

-- Léa and Zoé play on weekdays at 17:00, deadline 20:30; Tom has no routine.
insert into public.routines (child_id, days, start_time, deadline_time, goal_type, goal_value)
values
  ('00000000-0000-4000-8000-0000000000c1', '{1,2,3,4,5}', '17:00', '20:30', 'duration', 15),
  ('00000000-0000-4000-8000-0000000000c3', '{1,2,3,4,5}', '17:00', '20:30', 'duration', 15);

-- Zoé finished her daily session on Friday 16 October at 16:20, Paris time.
insert into public.sessions (
  id, child_id, kind, local_date, started_at, completed_at, goal_type, goal_value, answered,
  score, duration_s, goal_met, updated_at
)
values (
  '00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-0000000000c3', 'daily',
  '2026-10-16', '2026-10-16 16:05+02', '2026-10-16 16:20+02', 'duration', 15, 20, 18, 840, true,
  '2026-10-16 16:20+02'
);

create function pg_temp.as_user(id text, anonymous boolean default false) returns void
language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', id, 'role', 'authenticated', 'is_anonymous', anonymous)::text, true);
$$;

create function pg_temp.queued(child text) returns text[] language sql as $$
  select coalesce(array_agg(kind::text order by created_at, kind), '{}')
  from public.notifications where child_id = child::uuid;
$$;

create function pg_temp.lea_steps(day text) returns text[] language sql as $$
  select coalesce(array_agg(kind::text order by created_at), '{}')
  from public.notifications
  where child_id = '00000000-0000-4000-8000-0000000000c1' and dedup_key like '%:' || day;
$$;

create function pg_temp.body(child text, which public.notification_kind) returns text
language sql as $$
  select body from public.notifications where child_id = child::uuid and kind = which;
$$;

select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.push_tokens'::regclass, 'public.notifications'::regclass)),
  'RLS is enabled on push tokens and notifications'
);
select is(
  (select schedule from cron.job where jobname = 'run-reminders'),
  '* * * * *',
  'Reminders are computed every minute'
);

-- Push tokens ---------------------------------------------------------------------------------------

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select lives_ok(
  $$ select public.register_push_token('ExponentPushToken[lea-phone]', 'ios') $$,
  'A child device registers its push token'
);
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select lives_ok(
  $$ select public.register_push_token('ExponentPushToken[alice-phone]', 'android') $$,
  'A parent registers their push token'
);
select throws_ok(
  $$ select public.register_push_token('not a token', 'ios') $$,
  '23514', null,
  'Only Expo push tokens are accepted'
);
select is(
  (select array_agg(token) from public.push_tokens),
  '{ExponentPushToken[alice-phone]}',
  'A user reads their own push tokens only'
);
select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select public.register_push_token('ExponentPushToken[bob-phone]', 'ios');
select public.unregister_push_token('ExponentPushToken[alice-phone]');
select pg_temp.as_user('00000000-0000-4000-8000-0000000000d2', true);
select public.register_push_token('ExponentPushToken[old-tablet]', 'android');

reset role;
select is(
  (select count(*)::int from public.push_tokens),
  4,
  'Nobody removes another user''s push token'
);

-- Escalation on Friday 16 October (Paris time) ----------------------------------------------------

select is(private.enqueue_reminders('2026-10-16 16:19+02'), 0, 'Nothing is due before H - 10');
select is(
  private.enqueue_reminders('2026-10-16 16:50+02'),
  2,
  'H - 10: a reminder and an end-of-session alert are queued'
);
select is(
  pg_temp.queued('00000000-0000-4000-8000-0000000000c1'),
  '{routine_soon}',
  'It is for Léa, whose session is still to do'
);
select is(
  pg_temp.queued('00000000-0000-4000-8000-0000000000c3'),
  '{session_done}',
  'Zoé, done already, gets no reminder; her parents hear she has finished'
);
select is(
  pg_temp.body('00000000-0000-4000-8000-0000000000c3', 'session_done'),
  'Zoé a terminé' || chr(160) || ': 18/20 en 14' || chr(160) || 'min.',
  'The end-of-session alert gives the score and the time'
);
select is(private.enqueue_reminders('2026-10-16 16:53+02'), 0, 'A step is queued once');

select is(private.send_notifications('2026-10-16 16:50+02'), 2, 'Queued notifications are sent');
select is(
  (select push_tokens from public.notifications where kind = 'routine_soon'),
  '{ExponentPushToken[lea-phone]}',
  'A child reminder goes to the child''s paired devices only'
);
select is(
  (select push_tokens from public.notifications where kind = 'session_done'),
  '{ExponentPushToken[alice-phone]}',
  'A parent alert goes to the family''s parents only'
);
select ok(
  (select convert_from(q.body, 'utf8')::jsonb @> jsonb_build_array(jsonb_build_object(
     'to', 'ExponentPushToken[lea-phone]', 'title', 'Bientôt l’heure',
     'data', jsonb_build_object('url', '/child/home?id=00000000-0000-4000-8000-0000000000c1')))
   from public.notifications n
   join net.http_request_queue q on q.id = n.push_request_id
   where n.kind = 'routine_soon' and q.url = 'https://exp.host/--/api/v2/push/send'),
  'The reminder is posted to the Expo Push API, with the screen to open'
);
select is(private.send_notifications('2026-10-16 16:51+02'), 0, 'A notification is sent once');

select is(private.enqueue_reminders('2026-10-16 17:00+02'), 1, 'H: the start reminder');
select is(private.enqueue_reminders('2026-10-16 17:30+02'), 1, 'H + 30: a gentle reminder');
select is(private.enqueue_reminders('2026-10-16 18:00+02'), 1, 'H + 60: the parent is told');
select is(
  pg_temp.body('00000000-0000-4000-8000-0000000000c1', 'not_started'),
  'Léa n’a pas encore commencé ses exercices.',
  'The parent reads that the child has not started'
);
select is(
  (select url from public.notifications where kind = 'not_started'),
  '/parent/children/00000000-0000-4000-8000-0000000000c1',
  'Tapping it opens the child''s page, where the parent can send a message'
);

-- Léa starts at 20:00 but stops after a few answers.
insert into public.sessions (
  id, child_id, kind, local_date, started_at, goal_type, goal_value, answered, updated_at
)
values (
  '00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-0000000000c1', 'daily',
  '2026-10-16', '2026-10-16 20:00+02', 'duration', 15, 3, '2026-10-16 20:05+02'
);
select is(private.enqueue_reminders('2026-10-16 20:30+02'), 1, 'At the deadline, the day is missed');
select is(
  pg_temp.queued('00000000-0000-4000-8000-0000000000c1'),
  '{routine_soon,routine_start,routine_nudge,not_started,missed}',
  'The whole escalation, each step once'
);
select is(
  pg_temp.body('00000000-0000-4000-8000-0000000000c1', 'missed'),
  'Séance manquée aujourd’hui pour Léa.',
  'The parent reads that the session was missed'
);

-- Monday 19 October: Léa plays at 17:25, then is on holiday on Tuesday.
insert into public.sessions (
  id, child_id, kind, local_date, started_at, goal_type, goal_value, answered, updated_at
)
values (
  '00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-0000000000c1', 'daily',
  '2026-10-19', '2026-10-19 17:20+02', 'duration', 15, 8, '2026-10-19 17:28+02'
);
select private.enqueue_reminders('2026-10-19 17:30+02');
select is(pg_temp.lea_steps('2026-10-19'), '{}', 'No gentle reminder while the child is playing');
insert into public.vacations (child_id, from_date, to_date)
values ('00000000-0000-4000-8000-0000000000c1', '2026-10-20', '2026-10-30');
select private.enqueue_reminders('2026-10-20 17:00+02') + private.enqueue_reminders('2026-10-20 18:00+02');
select is(pg_temp.lea_steps('2026-10-20'), '{}', 'No reminder during holidays');
select is(
  private.enqueue_reminders('2026-10-17 17:00+02'),
  0,
  'No reminder on a day off'
);
delete from public.vacations;
select is(
  private.enqueue_reminders('2026-10-21 17:20+02'),
  0,
  'A step is skipped, not sent late, when its time passed over 10 minutes ago'
);

-- Stale notifications and Expo's answers --------------------------------------------------------

select private.enqueue_reminders('2026-10-21 17:30+02');
select is(
  private.send_notifications('2026-10-21 18:05+02'),
  0,
  'A notification queued over 30 minutes ago is not sent'
);

insert into net._http_response (id, status_code, content)
select push_request_id, 200,
  '{"data": [{"status": "error", "message": "gone", "details": {"error": "DeviceNotRegistered"}}]}'
from public.notifications where kind = 'routine_soon';
insert into net._http_response (id, status_code, content)
select push_request_id, 502, '<html>Bad gateway</html>'
from public.notifications where kind = 'session_done';
select private.collect_push_receipts();
select ok(
  not exists (select 1 from public.push_tokens where token = 'ExponentPushToken[lea-phone]'),
  'A device that uninstalled the app loses its token'
);
select is(
  (select array_agg(push_status order by kind) from public.notifications
   where kind in ('routine_soon', 'session_done')),
  '{200,502}'::smallint[],
  'Expo''s answer is recorded, even when it is not JSON'
);
select is(
  (select push_errors -> 0 ->> 'message' from public.notifications where kind = 'routine_soon'),
  'gone',
  'Failed tickets are kept for diagnosis'
);

-- Parent messages --------------------------------------------------------------------------------

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select is(
  public.send_child_message('00000000-0000-4000-8000-0000000000c1', '  C’est l’heure de ta séance !  '),
  0,
  'A parent sends their child a message, and learns that no device can show it'
);
select throws_ok(
  $$ select public.send_child_message('00000000-0000-4000-8000-0000000000c1', 'Encore ?') $$,
  'PT429', 'too_many_messages',
  'One message every 2 minutes per child'
);
select throws_ok(
  $$ select public.send_child_message('00000000-0000-4000-8000-0000000000c3', '   ') $$,
  'PT400', 'invalid_message',
  'A message is not empty'
);
select is(
  (select row(title, body)::text from public.notifications where kind = 'parent_message'),
  row('Message de Alice', 'C’est l’heure de ta séance !')::text,
  'Parents read their family''s notifications, the message signed with their name'
);
select throws_ok(
  $$ select push_tokens from public.notifications $$,
  '42501', null,
  'Parents do not read where notifications went'
);
select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select throws_ok(
  $$ select public.send_child_message('00000000-0000-4000-8000-0000000000c1', 'Coucou') $$,
  'PT404', 'child_not_found',
  'A parent cannot message another family''s child'
);
select is((select count(*)::int from public.notifications), 0, 'Nor read their notifications');
select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select throws_ok(
  $$ select public.send_child_message('00000000-0000-4000-8000-0000000000c1', 'Coucou') $$,
  'PT404', 'child_not_found',
  'A child device cannot send parent messages, nor read notifications'
);

select * from finish();
rollback;
