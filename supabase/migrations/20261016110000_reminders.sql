-- Phase 4: reminders and parent alerts, computed on the server.
--
-- Every minute, pg_cron runs private.run_reminders(): it queues the escalation steps due for each
-- child (from their routine, in their family's timezone) and the end-of-session alerts, then sends
-- them to the Expo Push API through pg_net. Being computed on the server, reminders stay right if
-- the child played on another device, the parent changed the routine or the phone was switched off.
-- Each notification is stored once (dedup_key), so a step is never sent twice.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create type public.notification_audience as enum ('child', 'parent');
create type public.notification_kind as enum (
  'routine_soon',   -- child, 10 minutes before the start time
  'routine_start',  -- child, at the start time
  'routine_nudge',  -- child, 30 minutes after
  'not_started',    -- parent, 60 minutes after
  'missed',         -- parent, at the deadline
  'session_done',   -- parent, when the daily session ends
  'parent_message'  -- child, sent by a parent
);

-- Tables -----------------------------------------------------------------------------------------

-- Expo push tokens of parents' phones and children's devices.
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique check (token ~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$'),
  platform public.device_platform not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_id_idx on public.push_tokens (user_id);

-- Notifications sent, kept 30 days.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  audience public.notification_audience not null,
  kind public.notification_kind not null,
  -- One per reminder step and day, per finished session, per parent message.
  dedup_key text not null unique,
  title text not null,
  body text not null,
  -- Opened in the app when the notification is tapped.
  url text not null,
  sent_at timestamptz,
  -- Tokens it went to, the pg_net request, then Expo's answer.
  push_tokens text[] not null default '{}',
  push_request_id bigint,
  push_status smallint,
  push_errors jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notifications_unsent_idx on public.notifications (created_at) where sent_at is null;
create index notifications_child_id_created_at_idx on public.notifications (child_id, created_at);
create index notifications_push_request_id_idx on public.notifications (push_request_id)
  where push_request_id is not null and push_status is null;

create trigger push_tokens_updated_at before update on public.push_tokens
  for each row execute function private.set_updated_at();
create trigger notifications_updated_at before update on public.notifications
  for each row execute function private.set_updated_at();

alter table public.push_tokens enable row level security;
alter table public.notifications enable row level security;

create policy "Users read their own push tokens" on public.push_tokens
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Parents read their family's notifications" on public.notifications
  for select to authenticated
  using (family_id = (select private.parent_family_id()));

-- What was sent and when, not where: push tokens and delivery details stay on the server.
revoke select on public.notifications from anon, authenticated;
grant select (id, family_id, child_id, audience, kind, title, body, url, sent_at, created_at)
  on public.notifications to authenticated;

-- Writes go through the functions below; no insert, update or delete policy exists.

-- Push tokens --------------------------------------------------------------------------------------

-- Called by the app once notifications are allowed. A token belongs to the last user who
-- registered it (a phone passed from parent to child mode changes hands).
create function public.register_push_token(p_token text, p_platform public.device_platform)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_signed_in' using errcode = 'PT401';
  end if;

  insert into public.push_tokens (user_id, token, platform)
  values ((select auth.uid()), p_token, p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform;
end;
$$;

-- Called at sign-out: the phone stops receiving this account's notifications.
create function public.unregister_push_token(p_token text)
returns void
language sql security definer
set search_path = ''
as $$
  delete from public.push_tokens t where t.token = p_token and t.user_id = (select auth.uid());
$$;

-- Content ------------------------------------------------------------------------------------------
-- Notification texts are shown by the phone itself, app closed: they are written here, in French.

create function private.notification_content(
  p_kind public.notification_kind,
  p_child_name text,
  p_detail jsonb default '{}'
)
returns table (title text, body text)
language plpgsql immutable
set search_path = ''
as $$
declare
  nbsp constant text := chr(160);
begin
  case p_kind
    when 'routine_soon' then
      title := 'Bientôt l’heure';
      body := 'Ta mission du jour arrive dans 10' || nbsp || 'minutes.';
    when 'routine_start' then
      title := 'C’est l’heure' || nbsp || '!';
      body := 'Ta mission du jour t’attend.';
    when 'routine_nudge' then
      title := 'Petit rappel';
      body := 'Ta mission du jour t’attend toujours.';
    when 'not_started' then
      title := 'Séance du jour';
      body := case when (p_detail ->> 'started')::boolean
        then p_child_name || ' a commencé sa séance sans la terminer.'
        else p_child_name || ' n’a pas encore commencé ses exercices.'
      end;
    when 'missed' then
      title := 'Séance du jour';
      body := 'Séance manquée aujourd’hui pour ' || p_child_name || '.';
    when 'session_done' then
      title := 'Séance du jour';
      body := p_child_name || ' a terminé' || nbsp || ': ' || (p_detail ->> 'score') || '/'
        || (p_detail ->> 'answered') || ' en ' || (p_detail ->> 'minutes') || nbsp || 'min.';
    when 'parent_message' then
      title := 'Message de ' || (p_detail ->> 'from');
      body := p_detail ->> 'message';
  end case;
  return next;
end;
$$;

-- App route opened by a tap: the child's home, or the child's page for parents.
create function private.notification_url(
  p_audience public.notification_audience,
  p_child_id uuid
)
returns text
language sql immutable
set search_path = ''
as $$
  select case p_audience
    when 'child' then '/child/home?id=' || p_child_id
    else '/parent/children/' || p_child_id
  end;
$$;

-- Push tokens of the child's paired devices, or of the family's parents.
create function private.notification_tokens(
  p_audience public.notification_audience,
  p_child_id uuid,
  p_family_id uuid
)
returns text[]
language sql stable security definer
set search_path = ''
as $$
  select coalesce(array_agg(t.token order by t.created_at), '{}')
  from public.push_tokens t
  where t.user_id in (
    select d.user_id
    from public.device_children dc
    join public.devices d on d.id = dc.device_id
    where p_audience = 'child' and dc.child_id = p_child_id and d.revoked_at is null
    union
    select p.user_id from public.parents p
    where p_audience = 'parent' and p.family_id = p_family_id
  );
$$;

-- Escalation ---------------------------------------------------------------------------------------

-- Queues what is due at p_now. A step fires within 10 minutes of its time (later, it is skipped
-- rather than sent late), only on a planned day without a finished session, and child reminders
-- wait while the child is playing (an answer synced in the last 10 minutes).
create function private.enqueue_reminders(p_now timestamptz default now())
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  step_window constant interval := interval '10 minutes';
  queued integer;
  done integer;
begin
  with today as (
    select c.id as child_id, c.family_id, c.display_name, f.timezone,
      (p_now at time zone f.timezone)::date as local_date
    from public.children c
    join public.families f on f.id = c.family_id
  ),
  planned as (
    select t.*,
      (t.local_date + p.start_time) at time zone t.timezone as start_at,
      (t.local_date + p.deadline_time) at time zone t.timezone as deadline_at
    from today t
    cross join lateral private.day_plan(t.child_id, t.local_date) p
  ),
  progress as (
    select pl.*,
      exists (
        select 1 from public.sessions s
        where s.child_id = pl.child_id and s.local_date = pl.local_date
          and s.completed_at is not null
      ) as finished,
      exists (
        select 1 from public.sessions s
        where s.child_id = pl.child_id and s.local_date = pl.local_date
      ) as started,
      exists (
        select 1 from public.sessions s
        where s.child_id = pl.child_id and s.local_date = pl.local_date
          and s.completed_at is null and s.updated_at > p_now - interval '10 minutes'
      ) as playing
    from planned pl
  ),
  due as (
    select pr.*, step.kind, step.audience
    from progress pr
    cross join lateral (
      values
        ('routine_soon'::public.notification_kind, 'child'::public.notification_audience,
          pr.start_at - interval '10 minutes'),
        ('routine_start', 'child', pr.start_at),
        ('routine_nudge', 'child', pr.start_at + interval '30 minutes'),
        ('not_started', 'parent', pr.start_at + interval '60 minutes'),
        ('missed', 'parent', pr.deadline_at)
    ) as step (kind, audience, due_at)
    where not pr.finished
      and p_now >= step.due_at and p_now < step.due_at + step_window
      and (step.kind = 'missed' or (step.due_at < pr.deadline_at and not pr.playing))
  )
  insert into public.notifications (
    family_id, child_id, audience, kind, dedup_key, title, body, url, created_at
  )
  select d.family_id, d.child_id, d.audience, d.kind,
    concat_ws(':', d.kind, d.child_id, d.local_date),
    content.title, content.body, private.notification_url(d.audience, d.child_id), p_now
  from due d
  cross join lateral private.notification_content(
    d.kind, d.display_name, jsonb_build_object('started', d.started)
  ) content
  on conflict (dedup_key) do nothing;
  get diagnostics queued = row_count;

  -- The parent hears when a daily session ends, with its score and active time.
  insert into public.notifications (
    family_id, child_id, audience, kind, dedup_key, title, body, url, created_at
  )
  select c.family_id, c.id, 'parent', 'session_done', concat_ws(':', 'session_done', s.id),
    content.title, content.body, private.notification_url('parent', c.id), p_now
  from public.sessions s
  join public.children c on c.id = s.child_id
  cross join lateral private.notification_content(
    'session_done', c.display_name, jsonb_build_object(
      'score', s.score, 'answered', s.answered, 'minutes', greatest(1, round(s.duration_s / 60.0))
    )
  ) content
  where s.kind = 'daily' and s.completed_at is not null
    and s.updated_at > p_now - interval '12 hours' and s.updated_at <= p_now
  on conflict (dedup_key) do nothing;
  get diagnostics done = row_count;

  return queued + done;
end;
$$;

-- Sending ------------------------------------------------------------------------------------------

-- Sends queued notifications to the Expo Push API (one request each, one message per token).
-- pg_net posts after the transaction commits; the answers are read by collect_push_receipts.
-- A notification nobody can receive, or queued over 30 minutes ago, is closed without sending.
create function private.send_notifications(p_now timestamptz default now())
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  item public.notifications;
  tokens text[];
  request bigint;
  sent integer := 0;
begin
  for item in
    select * from public.notifications n
    where n.sent_at is null
    order by n.created_at
    limit 200
    for update skip locked
  loop
    tokens := private.notification_tokens(item.audience, item.child_id, item.family_id);
    request := null;
    if cardinality(tokens) > 0 and item.created_at > p_now - interval '30 minutes' then
      request := net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        body := (
          select jsonb_agg(jsonb_build_object(
            'to', token, 'title', item.title, 'body', item.body, 'sound', 'default',
            'channelId', 'reminders', 'data', jsonb_build_object('url', item.url)
          ) order by position)
          from unnest(tokens) with ordinality as recipient (token, position)
        ),
        headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
      );
      sent := sent + 1;
    end if;
    update public.notifications n
    set sent_at = p_now, push_tokens = tokens, push_request_id = request
    where n.id = item.id;
  end loop;
  return sent;
end;
$$;

-- Reads Expo's answers: one ticket per message, in order. A device that uninstalled the app
-- (DeviceNotRegistered) loses its token.
create function private.collect_push_receipts()
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  item record;
  answer jsonb;
  tickets jsonb;
begin
  for item in
    select n.id, n.push_tokens, r.status_code, r.content, r.error_msg
    from public.notifications n
    join net._http_response r on r.id = n.push_request_id
    where n.push_request_id is not null and n.push_status is null
  loop
    begin
      answer := item.content::jsonb;
    exception when others then
      answer := null;
    end;
    tickets := case when jsonb_typeof(answer -> 'data') = 'array' then answer -> 'data' else '[]' end;

    delete from public.push_tokens t
    using jsonb_array_elements(tickets) with ordinality as ticket (value, position)
    where ticket.value -> 'details' ->> 'error' = 'DeviceNotRegistered'
      and t.token = item.push_tokens[ticket.position];

    -- Failed tickets, else a refused request (errors) or a network failure (error_msg).
    update public.notifications n
    set push_status = coalesce(item.status_code, 0),
        push_errors = coalesce(
          (select jsonb_agg(ticket.value) from jsonb_array_elements(tickets) as ticket (value)
           where ticket.value ->> 'status' = 'error'),
          answer -> 'errors',
          case when item.error_msg is not null
            then jsonb_build_array(jsonb_build_object('message', item.error_msg)) end
        )
    where n.id = item.id;
  end loop;
end;
$$;

-- What pg_cron runs every minute.
create function private.run_reminders()
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform private.collect_push_receipts();
  perform private.enqueue_reminders(now());
  perform private.send_notifications(now());
  delete from public.notifications n where n.created_at < now() - interval '30 days';
end;
$$;

revoke all on function private.notification_content(public.notification_kind, text, jsonb) from public;
revoke all on function private.notification_url(public.notification_audience, uuid) from public;
revoke all on function private.notification_tokens(public.notification_audience, uuid, uuid) from public;
revoke all on function private.enqueue_reminders(timestamptz) from public;
revoke all on function private.send_notifications(timestamptz) from public;
revoke all on function private.collect_push_receipts() from public;
revoke all on function private.run_reminders() from public;

select cron.schedule('run-reminders', '* * * * *', 'select private.run_reminders()');

-- Parent message -----------------------------------------------------------------------------------

-- A parent nudges their child with a message (from a list or their own), sent at once. Returns how
-- many devices it went to (0: no paired device allows notifications). One every 2 minutes per child.
create function public.send_child_message(p_child_id uuid, p_message text)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  caller public.parents;
  target public.children;
  message text := btrim(coalesce(p_message, ''));
begin
  select * into caller from public.parents where user_id = (select auth.uid());
  select * into target from public.children where id = p_child_id;

  if caller.id is null or target.id is null or target.family_id <> caller.family_id then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  if char_length(message) not between 1 and 120 then
    raise exception 'invalid_message' using errcode = 'PT400';
  end if;
  if exists (
    select 1 from public.notifications n
    where n.child_id = p_child_id and n.kind = 'parent_message'
      and n.created_at > now() - interval '2 minutes'
  ) then
    raise exception 'too_many_messages' using errcode = 'PT429';
  end if;

  insert into public.notifications (family_id, child_id, audience, kind, dedup_key, title, body, url)
  select target.family_id, target.id, 'child', 'parent_message',
    concat_ws(':', 'parent_message', gen_random_uuid()), content.title, content.body,
    private.notification_url('child', target.id)
  from private.notification_content(
    'parent_message', target.display_name,
    jsonb_build_object('from', caller.display_name, 'message', message)
  ) content;

  perform private.send_notifications(now());
  return cardinality(private.notification_tokens('child', target.id, target.family_id));
end;
$$;

revoke all on function public.register_push_token(text, public.device_platform) from public, anon;
revoke all on function public.unregister_push_token(text) from public, anon;
revoke all on function public.send_child_message(uuid, text) from public, anon;
grant execute on function public.register_push_token(text, public.device_platform) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;
grant execute on function public.send_child_message(uuid, text) to authenticated;
