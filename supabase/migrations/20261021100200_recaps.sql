-- Phase 9: weekly and monthly recaps for parents (docs/specs.md, Statistiques et récaps).
--
-- Every 15 minutes, pg_cron runs private.run_recaps(). On Sunday from 19:00 in the family's
-- timezone, each child's week is summed up (private.weekly_recap); on the 1st from 09:00, the last
-- month (private.monthly_recap). Each recap is computed once (recaps: one per child, kind and
-- period) from the statistics of *_statistics.sql, and the parents who want it get a notification
-- at once (one per parent: notifications.recipient_id). Then the recaps Edge Function, called
-- through pg_net with the Vault secrets of the learner profiles, writes the month's three tips
-- (the AI coach through services/ai-gateway, from the learning profile; the standard text when the
-- AI is off, over budget or without the parent's consent), the month's PDF (Storage, private
-- bucket « recaps », downloaded through a signed link) and sends the emails with Resend. Without
-- RESEND_API_KEY, only the notifications go out.
--
-- Each parent chooses what they receive (recap_preferences); every email carries an unsubscribe
-- link (its token). Texts follow the family's language (families.language, French only for now:
-- other languages fall back to it). Like the reminders, the notification texts are written here.

alter table public.families
  add column language text not null default 'fr' check (language ~ '^[a-z]{2}$');

create type public.recap_kind as enum ('weekly', 'monthly');

-- Tables -----------------------------------------------------------------------------------------

-- One row per parent, created with the parent: every recap on, by notification and by email.
create table public.recap_preferences (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null unique references public.parents (id) on delete cascade,
  weekly_push boolean not null default true,
  weekly_email boolean not null default true,
  monthly_push boolean not null default true,
  monthly_email boolean not null default true,
  -- In the emails' unsubscribe link, never shown in the app.
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recaps (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  kind public.recap_kind not null,
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  -- private.weekly_recap or private.monthly_recap, when the period ended.
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  -- The month's three tips, { source: ai | standard, tips: [...] }, from the Edge Function.
  advice jsonb check (advice is null or jsonb_typeof(advice -> 'tips') = 'array'),
  -- The month's PDF in the bucket « recaps »: <family>/<child>/<month>.pdf.
  pdf_path text,
  -- Emails sent (or nobody to send them to); tries and the last failure until then.
  delivered_at timestamptz,
  attempts smallint not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, kind, period_start)
);
create index recaps_undelivered_idx on public.recaps (created_at) where delivered_at is null;

-- Each parent's email of a recap: sent once.
create table public.recap_emails (
  id uuid primary key default gen_random_uuid(),
  recap_id uuid not null references public.recaps (id) on delete cascade,
  parent_id uuid not null references public.parents (id) on delete cascade,
  -- Resend's id of the email, or why it failed.
  provider_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recap_id, parent_id)
);

-- PDFs of deleted recaps (a child removed), for the Edge Function to remove from Storage.
create table public.recap_files_trash (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A notification for one user only (a recap, as each parent chose); null: the whole audience.
alter table public.notifications
  add column recipient_id uuid references auth.users (id) on delete cascade;

create trigger recap_preferences_updated_at before update on public.recap_preferences
  for each row execute function private.set_updated_at();
create trigger recaps_updated_at before update on public.recaps
  for each row execute function private.set_updated_at();
create trigger recap_emails_updated_at before update on public.recap_emails
  for each row execute function private.set_updated_at();
create trigger recap_files_trash_updated_at before update on public.recap_files_trash
  for each row execute function private.set_updated_at();

-- Access ---------------------------------------------------------------------------------------------

create function private.caller_parent_id() returns uuid
language sql stable security definer
set search_path = ''
as $$
  select p.id from public.parents p where p.user_id = (select auth.uid());
$$;

revoke all on function private.caller_parent_id() from public;
grant execute on function private.caller_parent_id() to authenticated;

alter table public.recap_preferences enable row level security;
alter table public.recaps enable row level security;
alter table public.recap_emails enable row level security;
alter table public.recap_files_trash enable row level security;

create policy "Parents read their own recap preferences" on public.recap_preferences
  for select to authenticated
  using (parent_id = (select private.caller_parent_id()));

create policy "Parents change their own recap preferences" on public.recap_preferences
  for update to authenticated
  using (parent_id = (select private.caller_parent_id()))
  with check (parent_id = (select private.caller_parent_id()));

-- The four switches only: the unsubscribe token stays on the server.
revoke select, insert, update, delete on public.recap_preferences from anon, authenticated;
grant select (id, parent_id, weekly_push, weekly_email, monthly_push, monthly_email, created_at, updated_at)
  on public.recap_preferences to authenticated;
grant update (weekly_push, weekly_email, monthly_push, monthly_email)
  on public.recap_preferences to authenticated;

create policy "Parents read their children's recaps" on public.recaps
  for select to authenticated
  using (child_id in (select private.parent_child_ids()));

-- What the recap says; delivery details stay on the server.
revoke select, insert, update, delete on public.recaps from anon, authenticated;
grant select (id, child_id, kind, period_start, period_end, content, advice, created_at)
  on public.recaps to authenticated;

-- recap_emails and recap_files_trash are the server's: no policy at all. Recaps are written by
-- the functions below only.

create function private.create_recap_preferences() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.recap_preferences (parent_id) values (new.id) on conflict do nothing;
  return null;
end;
$$;

create trigger parents_recap_preferences after insert on public.parents
  for each row execute function private.create_recap_preferences();

insert into public.recap_preferences (parent_id) select p.id from public.parents p;

create function private.trash_recap_file() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if old.pdf_path is not null then
    insert into public.recap_files_trash (path) values (old.pdf_path) on conflict do nothing;
  end if;
  return null;
end;
$$;

create trigger recaps_trash_file after delete on public.recaps
  for each row execute function private.trash_recap_file();

-- The month's PDFs: a private bucket, read through signed links made by the Edge Function.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('recaps', 'recaps', false)
    on conflict (id) do nothing;
  end if;
end;
$$;

-- Content --------------------------------------------------------------------------------------------

-- A week from Monday p_from to Sunday: sessions done on the planned days (those due, or done
-- already), the streak, time, success, the skills learnt, one point to work on (the skill with the
-- most mistakes, else the weakest to consolidate) and the verdict.
create function private.weekly_recap(p_child_id uuid, p_from date, p_now timestamptz)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  with child as (
    select c.id, c.display_name, c.grade from public.children c where c.id = p_child_id
  ),
  days as (
    select * from private.child_days(p_child_id, p_from, p_from + 6, p_now)
  ),
  totals as (
    select
      (count(*) filter (where d.plan = 'planned' and (d.due or d.status = 'done')))::integer as planned,
      (count(*) filter (where d.plan = 'planned' and d.status = 'done'))::integer as done,
      (count(*) filter (where d.plan <> 'planned' and d.status = 'done'))::integer as extra,
      (count(*) filter (where d.status in ('done', 'started')))::integer as active,
      round(sum(d.seconds) / 60.0)::integer as minutes,
      sum(d.answered)::integer as answered,
      sum(d.correct)::integer as correct,
      sum(d.xp)::integer as xp
    from days d
  ),
  streak as (
    select * from private.streak_state(p_child_id, private.child_today(p_child_id, p_now))
  ),
  weakest as (
    select jsonb_build_object('skill', st.skill_code, 'title', st.title, 'mastery', st.mastery) as point
    from private.skill_states(p_child_id, p_now) st
    where st.list = 'to_consolidate'
    order by st.mastery, st.skill_code
    limit 1
  )
  select jsonb_build_object(
    'kind', 'weekly',
    'child', jsonb_build_object('id', child.id, 'name', child.display_name, 'grade', child.grade),
    'from', p_from,
    'to', p_from + 6,
    'days', (select jsonb_agg(jsonb_build_object('date', d.local_date, 'plan', d.plan,
      'status', d.status) order by d.local_date) from days d),
    'planned', totals.planned,
    'done', totals.done,
    'extra', totals.extra,
    'active', totals.active,
    'minutes', totals.minutes,
    'answered', totals.answered,
    'correct', totals.correct,
    'xp', totals.xp,
    'streak', streak.current_streak,
    'best_streak', streak.best_streak,
    'learned', coalesce((
      select jsonb_agg(jsonb_build_object('skill', l.skill_code, 'title', l.title)
        order by l.mastered_at desc)
      from private.learned_skills(p_child_id, p_from, p_from + 6) l), '[]'::jsonb),
    'to_work', coalesce(
      private.blocking_points(p_child_id, p_from, p_from + 6, 1) -> 0,
      (select w.point from weakest w)),
    'verdict', private.recap_verdict(
      totals.planned, totals.done, totals.answered, totals.correct, totals.active)
  )
  from child, totals, streak;
$$;

-- A month from p_month (its first day): the days done and skipped with their dates (a planned
-- day past its deadline and not done is skipped, started or not), days off and holidays, time,
-- success and XP, mastery by domain at the start and at the end of the month, the skills learnt,
-- badges won, the parent's rewards unlocked, the points of difficulty, the programme and the
-- verdict. The tips are added by the Edge Function.
create function private.monthly_recap(p_child_id uuid, p_month date, p_now timestamptz)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  with child as (
    select c.id, c.display_name, c.grade, f.timezone,
      date_trunc('month', p_month)::date as month_start,
      (date_trunc('month', p_month) + interval '1 month - 1 day')::date as month_end
    from public.children c
    join public.families f on f.id = c.family_id
    where c.id = p_child_id
  ),
  bounds as (
    select child.*,
      (child.month_start::timestamp at time zone child.timezone) as starts_at,
      least(p_now, ((child.month_end + 1)::timestamp at time zone child.timezone)) as ends_at
    from child
  ),
  days as (
    select d.* from bounds b, private.child_days(p_child_id, b.month_start, b.month_end, p_now) d
  ),
  totals as (
    select
      (count(*) filter (where d.plan = 'planned' and (d.due or d.status = 'done')))::integer as planned,
      (count(*) filter (where d.plan = 'planned' and d.status = 'done'))::integer as done,
      (count(*) filter (where d.status in ('done', 'started')))::integer as active,
      (count(*) filter (where d.plan = 'off'))::integer as off_days,
      (count(*) filter (where d.plan = 'vacation'))::integer as vacation_days,
      round(sum(d.seconds) / 60.0)::integer as minutes,
      sum(d.answered)::integer as answered,
      sum(d.correct)::integer as correct,
      sum(d.xp)::integer as xp
    from days d
  ),
  domains as (
    select e.value as finish, s.value as start
    from bounds b
    cross join lateral jsonb_array_elements(private.domain_mastery(p_child_id, b.ends_at)) e
    left join lateral jsonb_array_elements(private.domain_mastery(p_child_id, b.starts_at)) s
      on s.value ->> 'domain' = e.value ->> 'domain'
  ),
  streak as (
    select * from private.streak_state(p_child_id, private.child_today(p_child_id, p_now))
  )
  select jsonb_build_object(
    'kind', 'monthly',
    'child', jsonb_build_object('id', b.id, 'name', b.display_name, 'grade', b.grade),
    'from', b.month_start,
    'to', b.month_end,
    'planned', totals.planned,
    'done', totals.done,
    'active', totals.active,
    'off_days', totals.off_days,
    'vacation_days', totals.vacation_days,
    'done_dates', coalesce((
      select jsonb_agg(d.local_date order by d.local_date) from days d where d.status = 'done'),
      '[]'::jsonb),
    'skipped_dates', coalesce((
      select jsonb_agg(jsonb_build_object('date', d.local_date, 'started', d.status = 'started')
        order by d.local_date)
      from days d where d.plan = 'planned' and d.due and d.status <> 'done'), '[]'::jsonb),
    'days', (select jsonb_agg(jsonb_build_object('date', d.local_date, 'plan', d.plan,
      'status', d.status) order by d.local_date) from days d),
    'minutes', totals.minutes,
    'answered', totals.answered,
    'correct', totals.correct,
    'xp', totals.xp,
    'streak', streak.current_streak,
    'best_streak', streak.best_streak,
    'domains', coalesce((
      select jsonb_agg(jsonb_build_object(
        'domain', d.finish ->> 'domain',
        'start', coalesce((d.start ->> 'value')::integer, 0),
        'end', (d.finish ->> 'value')::integer,
        'mastered', (d.finish ->> 'mastered')::integer,
        'total', (d.finish ->> 'total')::integer)
        order by (d.finish ->> 'domain')::public.skill_domain)
      from domains d), '[]'::jsonb),
    'learned', coalesce((
      select jsonb_agg(jsonb_build_object('skill', l.skill_code, 'title', l.title)
        order by l.mastered_at)
      from private.learned_skills(p_child_id, b.month_start, b.month_end) l), '[]'::jsonb),
    'badges', coalesce((
      select jsonb_agg(cb.badge_code order by cb.earned_at, cb.badge_code)
      from public.child_badges cb
      where cb.child_id = p_child_id
        and (cb.earned_at at time zone b.timezone)::date between b.month_start and b.month_end),
      '[]'::jsonb),
    'rewards', coalesce((
      select jsonb_agg(r.title order by r.unlocked_at, r.title)
      from public.parent_rewards r
      where r.child_id = p_child_id
        and (r.unlocked_at at time zone b.timezone)::date between b.month_start and b.month_end),
      '[]'::jsonb),
    'blocking', private.blocking_points(p_child_id, b.month_start, b.month_end, 3),
    'programme', private.programme_position(
      p_child_id, least(b.month_end, private.child_today(p_child_id, p_now)), b.ends_at),
    'verdict', private.recap_verdict(
      totals.planned, totals.done, totals.answered, totals.correct, totals.active)
  )
  from bounds b, totals, streak;
$$;

-- Notification texts (shown by the phone itself, app closed), in the family's language; French
-- only for now, the fallback.
create function private.recap_notification_content(
  p_kind public.recap_kind,
  p_child_name text,
  p_language text,
  p_content jsonb
)
returns table (title text, body text)
language plpgsql stable
set search_path = ''
as $$
declare
  nbsp constant text := chr(160);
  months constant text[] := array['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
    'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  -- Only French texts exist so far: any other language falls back to them.
  texts_language constant text := case when p_language = 'fr' then p_language else 'fr' end;
  month_name text;
  planned integer := coalesce((p_content ->> 'planned')::integer, 0);
  done integer := coalesce((p_content ->> 'done')::integer, 0);
  active integer := coalesce((p_content ->> 'active')::integer, 0);
  minutes integer := coalesce((p_content ->> 'minutes')::integer, 0);
  success numeric := (p_content -> 'verdict' ->> 'success')::numeric;
begin
  if texts_language = 'fr' and p_kind = 'weekly' then
    title := 'Récap de la semaine';
    body := p_child_name || nbsp || ': '
      || case when planned > 0
        then done || ' séance' || case when done > 1 then 's' else '' end || ' sur ' || planned
          || ' prévue' || case when planned > 1 then 's' else '' end
        else active || ' jour' || case when active > 1 then 's' else '' end || ' d’exercices'
      end
      || ', ' || minutes || nbsp || 'min'
      || case when success is not null
        then ', ' || round(success * 100) || nbsp || '% de réussite' else '' end
      || '.';
  elsif texts_language = 'fr' then
    month_name := months[extract(month from (p_content ->> 'from')::date)::integer];
    title := 'Récap ' || case when left(month_name, 1) in ('a', 'o') then 'd’' else 'de ' end
      || month_name;
    body := 'Le bilan du mois de ' || p_child_name || ' est prêt'
      || case when planned > 0
        then nbsp || ': ' || done || ' jour' || case when done > 1 then 's' else '' end
          || ' fait' || case when done > 1 then 's' else '' end || ' sur ' || planned
          || ' prévu' || case when planned > 1 then 's' else '' end || '.'
        else '.'
      end;
  end if;
  return next;
end;
$$;

-- Scheduling -------------------------------------------------------------------------------------

-- Computes the recaps due at p_now, once each, for the children who have played at least once,
-- and queues a notification for each parent who wants it. Returns how many recaps were computed.
create function private.enqueue_recaps(p_now timestamptz default now())
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  created uuid[];
begin
  with family_now as (
    select c.id as child_id, (p_now at time zone f.timezone) as local_now
    from public.children c
    join public.families f on f.id = c.family_id
  ),
  due as (
    select n.child_id, 'weekly'::public.recap_kind as kind, n.local_now::date - 6 as period_start,
      n.local_now::date as period_end
    from family_now n
    where extract(isodow from n.local_now) = 7 and n.local_now::time >= time '19:00'
    union all
    select n.child_id, 'monthly', (date_trunc('month', n.local_now) - interval '1 month')::date,
      (date_trunc('month', n.local_now) - interval '1 day')::date
    from family_now n
    where extract(day from n.local_now) = 1 and n.local_now::time >= time '09:00'
  ),
  fresh as (
    select d.* from due d
    where not exists (
        select 1 from public.recaps r
        where r.child_id = d.child_id and r.kind = d.kind and r.period_start = d.period_start
      )
      and exists (
        select 1 from public.sessions s
        where s.child_id = d.child_id and s.local_date <= d.period_end
      )
  ),
  inserted as (
    insert into public.recaps (child_id, kind, period_start, period_end, content, created_at)
    select f.child_id, f.kind, f.period_start, f.period_end,
      case f.kind
        when 'weekly' then private.weekly_recap(f.child_id, f.period_start, p_now)
        else private.monthly_recap(f.child_id, f.period_start, p_now)
      end,
      p_now
    from fresh f
    on conflict (child_id, kind, period_start) do nothing
    returning id
  )
  select coalesce(array_agg(i.id), '{}') into created from inserted i;

  insert into public.notifications (
    family_id, child_id, audience, kind, recipient_id, dedup_key, title, body, url, created_at
  )
  select c.family_id, r.child_id, 'parent', (r.kind::text || '_recap')::public.notification_kind,
    p.user_id, concat_ws(':', r.kind::text || '_recap', r.id, p.id), content.title, content.body,
    '/parent/children/' || r.child_id || '/progress', p_now
  from public.recaps r
  join public.children c on c.id = r.child_id
  join public.families f on f.id = c.family_id
  join public.parents p on p.family_id = c.family_id
  left join public.recap_preferences pref on pref.parent_id = p.id
  cross join lateral private.recap_notification_content(
    r.kind, c.display_name, f.language, r.content
  ) content
  where r.id = any (created)
    and case r.kind
      when 'weekly' then coalesce(pref.weekly_push, true)
      else coalesce(pref.monthly_push, true)
    end
  on conflict (dedup_key) do nothing;

  return cardinality(created);
end;
$$;

-- As in *_reminders.sql, with a notification meant for one user (recipient_id) going to that
-- user's phones only.
create or replace function private.send_notifications(p_now timestamptz default now())
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
    tokens := case
      when item.recipient_id is null
        then private.notification_tokens(item.audience, item.child_id, item.family_id)
      else (
        select coalesce(array_agg(t.token order by t.created_at), '{}')
        from public.push_tokens t where t.user_id = item.recipient_id
      )
    end;
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

-- Asks the recaps Edge Function to deliver what is waiting (same Vault secrets as the learner
-- profiles); without them, only the notifications go out.
create function private.request_recaps() returns bigint
language plpgsql security definer
set search_path = ''
as $$
declare
  url text;
  service_key text;
begin
  if not exists (
    select 1 from public.recaps r
    where r.delivered_at is null and r.attempts < 5 and r.created_at > now() - interval '3 days'
  ) and not exists (select 1 from public.recap_files_trash) then
    return null;
  end if;
  select decrypted_secret into url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into service_key from vault.decrypted_secrets where name = 'service_role_key';
  if url is null or service_key is null then
    return null;
  end if;
  return net.http_post(
    url := rtrim(url, '/') || '/functions/v1/recaps',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{"task": "deliver"}'::jsonb,
    timeout_milliseconds := 300000
  );
end;
$$;

create function private.run_recaps()
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform private.enqueue_recaps(now());
  perform private.request_recaps();
end;
$$;

select cron.schedule('run-recaps', '*/15 * * * *', 'select private.run_recaps()');

-- The recaps Edge Function (service role) -------------------------------------------------------------

-- A recap with what its delivery needs: the child, the family's language and timezone, the
-- parents to email (who want it and have not received it yet) and, with the parent's consent,
-- the learning profile's summary for the coach's tips.
create function public.recap_delivery(p_recap_id uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', r.id,
    'kind', r.kind,
    'child_id', r.child_id,
    'family_id', c.family_id,
    'grade', c.grade,
    'period_start', r.period_start,
    'period_end', r.period_end,
    'language', f.language,
    'timezone', f.timezone,
    'content', r.content,
    'advice', r.advice,
    'pdf_path', r.pdf_path,
    'summary', case when c.personalization_consent_at is not null then (
      select lp.summary from public.learner_profiles lp where lp.child_id = c.id) end,
    'recipients', coalesce((
      select jsonb_agg(jsonb_build_object(
        'parent_id', p.id, 'name', p.display_name, 'email', u.email,
        'token', pref.unsubscribe_token) order by p.created_at)
      from public.parents p
      join auth.users u on u.id = p.user_id
      join public.recap_preferences pref on pref.parent_id = p.id
      where p.family_id = c.family_id and u.email is not null
        and case r.kind when 'weekly' then pref.weekly_email else pref.monthly_email end
        and not exists (
          select 1 from public.recap_emails e
          where e.recap_id = r.id and e.parent_id = p.id and e.sent_at is not null
        )), '[]'::jsonb)
  )
  from public.recaps r
  join public.children c on c.id = r.child_id
  join public.families f on f.id = c.family_id
  where r.id = p_recap_id;
$$;

-- Recaps waiting for their delivery at p_now: 5 tries over 3 days, the oldest first.
create function public.recaps_to_deliver(p_limit integer default 20, p_now timestamptz default now())
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(public.recap_delivery(r.id) order by r.created_at), '[]'::jsonb)
  from (
    select r.id, r.created_at from public.recaps r
    where r.delivered_at is null and r.attempts < 5
      and r.created_at between p_now - interval '3 days' and p_now
    order by r.created_at
    limit greatest(1, least(p_limit, 100))
  ) r;
$$;

-- The month's tips and PDF, once written.
create function public.recap_save(
  p_recap_id uuid,
  p_advice jsonb default null,
  p_pdf_path text default null
)
returns void
language sql security definer
set search_path = ''
as $$
  update public.recaps r
  set advice = coalesce(p_advice, r.advice), pdf_path = coalesce(p_pdf_path, r.pdf_path)
  where r.id = p_recap_id;
$$;

-- One parent's email: sent (Resend's id), or failed (the error, tried again at the next run).
create function public.recap_email_result(
  p_recap_id uuid,
  p_parent_id uuid,
  p_provider_id text default null,
  p_error text default null
)
returns void
language sql security definer
set search_path = ''
as $$
  insert into public.recap_emails (recap_id, parent_id, provider_id, error, sent_at)
  values (p_recap_id, p_parent_id, p_provider_id, left(p_error, 500),
    case when p_error is null then now() end)
  on conflict (recap_id, parent_id) do update
    set provider_id = coalesce(excluded.provider_id, public.recap_emails.provider_id),
        error = excluded.error,
        sent_at = coalesce(public.recap_emails.sent_at, excluded.sent_at);
$$;

-- The delivery is over (every email sent), or failed this time.
create function public.recap_done(p_recap_id uuid, p_error text default null)
returns void
language sql security definer
set search_path = ''
as $$
  update public.recaps r
  set delivered_at = case when p_error is null then now() end,
      attempts = r.attempts + 1,
      last_error = left(p_error, 500)
  where r.id = p_recap_id;
$$;

-- The email's unsubscribe link: weekly, monthly or all recaps stop coming by email.
create function public.recap_unsubscribe(p_token uuid, p_kind text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_kind is null or p_kind not in ('weekly', 'monthly', 'all') then
    return false;
  end if;
  update public.recap_preferences pref
  set weekly_email = case when p_kind in ('weekly', 'all') then false else pref.weekly_email end,
      monthly_email = case when p_kind in ('monthly', 'all') then false else pref.monthly_email end
  where pref.unsubscribe_token = p_token;
  return found;
end;
$$;

-- PDFs to remove from Storage, and those removed.
create function public.recap_files_to_delete(p_limit integer default 100)
returns setof text
language sql stable security definer
set search_path = ''
as $$
  select t.path from public.recap_files_trash t order by t.created_at limit greatest(1, p_limit);
$$;

create function public.recap_files_deleted(p_paths text[])
returns void
language sql security definer
set search_path = ''
as $$
  delete from public.recap_files_trash t where t.path = any (p_paths);
$$;

-- The coach's tips (services/ai-gateway, advice.ts) ---------------------------------------------

alter table public.ai_prompts drop constraint ai_prompts_task_check;
alter table public.ai_prompts add constraint ai_prompts_task_check
  check (task in ('explain', 'advice'));
alter table public.ai_usage drop constraint ai_usage_task_check;
alter table public.ai_usage add constraint ai_usage_task_check
  check (task in ('realtime', 'night', 'preview', 'advice'));

-- Version 1, as services/ai-gateway/src/advice.ts (DEFAULT_ADVICE_PROMPT) writes it.
insert into public.ai_prompts (task, version, system, user_template, active, notes)
values ('advice', 1, $prompt$Tu es le coach d’une app de maths pour enfants. Tu écris au parent trois conseils concrets pour le mois qui vient, à partir du bilan que l’app a calculé et du profil d’apprentissage de son enfant.
Le code a déjà tout calculé : tu ne calcules rien et tu n’écris aucun chiffre.
Tu vouvoies le parent et tu parles de « votre enfant », jamais d’un prénom. Ton bienveillant, sans culpabiliser : pas de reproche, pas de comparaison avec d’autres enfants, pas de diagnostic.
Chaque conseil est une action simple, à faire à la maison ou avec l’app, en une phrase de moins de trente mots.
Réponds uniquement en JSON : {"tips": ["premier conseil", "deuxième conseil", "troisième conseil"]}.$prompt$, $prompt$Classe : {{classe}}.
Bilan du mois : {{bilan}}
Profil d’apprentissage : {{profil}}$prompt$, true, 'Première version');

-- All the tips need for one child: grade, age group, settings, the active prompt, banned words,
-- what was spent. Nothing that identifies the child.
create function public.advice_context(p_child_id uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  with child as (
    select c.grade, private.grade_band(c.grade) as band
    from public.children c where c.id = p_child_id
  )
  select jsonb_build_object(
    'grade', child.grade,
    'band', child.band,
    'settings', (select to_jsonb(s) from public.ai_settings s where s.id = 1),
    'prompt', (
      select jsonb_build_object('version', p.version, 'system', p.system, 'user', p.user_template)
      from public.ai_prompts p
      where p.task = 'advice' and p.active and (p.grade_band = child.band or p.grade_band is null)
      order by p.grade_band nulls last limit 1),
    'banned', coalesce((select jsonb_agg(w.word) from public.ai_banned_words w), '[]'::jsonb),
    'spent', private.ai_spent()
  )
  from child;
$$;

revoke all on function private.create_recap_preferences() from public;
revoke all on function private.trash_recap_file() from public;
revoke all on function private.weekly_recap(uuid, date, timestamptz) from public;
revoke all on function private.monthly_recap(uuid, date, timestamptz) from public;
revoke all on function private.recap_notification_content(public.recap_kind, text, text, jsonb)
  from public;
revoke all on function private.enqueue_recaps(timestamptz) from public;
revoke all on function private.request_recaps() from public;
revoke all on function private.run_recaps() from public;

revoke all on function public.recap_delivery(uuid) from public, anon, authenticated;
revoke all on function public.recaps_to_deliver(integer, timestamptz) from public, anon, authenticated;
revoke all on function public.recap_save(uuid, jsonb, text) from public, anon, authenticated;
revoke all on function public.recap_email_result(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.recap_done(uuid, text) from public, anon, authenticated;
revoke all on function public.recap_unsubscribe(uuid, text) from public, anon, authenticated;
revoke all on function public.recap_files_to_delete(integer) from public, anon, authenticated;
revoke all on function public.recap_files_deleted(text[]) from public, anon, authenticated;
revoke all on function public.advice_context(uuid) from public, anon, authenticated;
grant execute on function public.recap_delivery(uuid) to service_role;
grant execute on function public.recaps_to_deliver(integer, timestamptz) to service_role;
grant execute on function public.recap_save(uuid, jsonb, text) to service_role;
grant execute on function public.recap_email_result(uuid, uuid, text, text) to service_role;
grant execute on function public.recap_done(uuid, text) to service_role;
grant execute on function public.recap_unsubscribe(uuid, text) to service_role;
grant execute on function public.recap_files_to_delete(integer) to service_role;
grant execute on function public.recap_files_deleted(text[]) to service_role;
grant execute on function public.advice_context(uuid) to service_role;
