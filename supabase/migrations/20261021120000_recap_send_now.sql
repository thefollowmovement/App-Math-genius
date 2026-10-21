-- Phase 9: a recap sent at once, to check the whole chain on a real account (notification, email,
-- the month's PDF, the Progrès page) without waiting for Sunday evening or the 1st of the month.
--
-- From the dashboard's SQL Editor (Studio locally), as the database owner:
--   select private.send_recap_now('<the parent''s email>', 'weekly');
--   select private.send_recap_now('<the parent''s email>', 'monthly');
-- Each child of that parent's family gets the recap of the current week or month so far
-- (p_previous => true: the last complete one), for that parent only: a notification to their
-- phones and an email (with the month's PDF), as their recap settings allow. The answer says what
-- went out and what is missing.
--
-- Such a test recap (recaps.test_parent_id) is replaced by the next test of the same period, and by
-- the real recap when the period ends (private.enqueue_recaps, below): the real one is computed and
-- delivered as if the test had never been. A real recap is never touched by a test.

alter table public.recaps
  add column test_parent_id uuid references public.parents (id) on delete cascade;

comment on column public.recaps.test_parent_id is
  'A test recap (private.send_recap_now): for this parent only, until the real one replaces it.';

-- As in *_recaps.sql, with a test recap of the same period giving way to the real one: its emails
-- are forgotten, its content, tips, PDF and delivery start again.
create or replace function private.enqueue_recaps(p_now timestamptz default now())
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
          and r.test_parent_id is null
      )
      and exists (
        select 1 from public.sessions s
        where s.child_id = d.child_id and s.local_date <= d.period_end
      )
  ),
  forgotten as (
    delete from public.recap_emails e
    using public.recaps r, fresh f
    where e.recap_id = r.id and r.test_parent_id is not null
      and r.child_id = f.child_id and r.kind = f.kind and r.period_start = f.period_start
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
    on conflict (child_id, kind, period_start) do update
      set period_end = excluded.period_end, content = excluded.content, advice = null,
        pdf_path = null, delivered_at = null, attempts = 0, last_error = null,
        created_at = excluded.created_at, test_parent_id = null
      where public.recaps.test_parent_id is not null
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

-- As in *_recaps.sql, a test recap going to the parent who asked for it only.
create or replace function public.recap_delivery(p_recap_id uuid)
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
        and (r.test_parent_id is null or p.id = r.test_parent_id)
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

-- The test: the recap of each child of the parent's family, computed at p_now, its notification
-- sent at once and its delivery requested from the recaps Edge Function. Answers with what went
-- out: the recaps (period, sessions in it), the children skipped (a real recap of that period
-- exists already), the notification (sent, turned_off, no_push_token: no phone registered for this
-- parent, or nothing_to_send) and the email (requested, turned_off, no_vault_secrets: the Edge
-- Function cannot be called, or nothing_to_send).
create function private.send_recap_now(
  p_email text,
  p_kind public.recap_kind,
  p_previous boolean default false,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  parent record;
  child record;
  first_day date;
  final_day date;
  sent_recap uuid;
  done_recaps jsonb := '[]'::jsonb;
  skipped jsonb := '[]'::jsonb;
  notified integer := 0;
  phones integer;
  has_secrets boolean;
begin
  select p.id, p.user_id, p.family_id, p.display_name, u.email::text as address,
    coalesce(case p_kind when 'weekly' then pref.weekly_push else pref.monthly_push end, true)
      as wants_push,
    coalesce(case p_kind when 'weekly' then pref.weekly_email else pref.monthly_email end, false)
      as wants_email
  into parent
  from public.parents p
  join auth.users u on u.id = p.user_id
  left join public.recap_preferences pref on pref.parent_id = p.id
  where lower(u.email::text) = lower(trim(p_email));
  if not found then
    raise exception 'parent_not_found' using errcode = 'PT404';
  end if;

  for child in
    select c.id, c.display_name, c.family_id, f.timezone, f.language
    from public.children c
    join public.families f on f.id = c.family_id
    where c.family_id = parent.family_id
    order by c.created_at, c.id
  loop
    if p_kind = 'weekly' then
      first_day := date_trunc('week', (p_now at time zone child.timezone)::date::timestamp)::date
        - case when p_previous then 7 else 0 end;
      final_day := first_day + 6;
    else
      first_day := (date_trunc('month', (p_now at time zone child.timezone)::date::timestamp)
        - case when p_previous then interval '1 month' else interval '0 days' end)::date;
      final_day := (first_day + interval '1 month - 1 day')::date;
    end if;

    if exists (
      select 1 from public.recaps r
      where r.child_id = child.id and r.kind = p_kind and r.period_start = first_day
        and r.test_parent_id is null
    ) then
      skipped := skipped || jsonb_build_object(
        'child', child.display_name, 'from', first_day, 'reason', 'real_recap_exists');
      continue;
    end if;

    -- A test of the same period again: its emails go again.
    delete from public.recap_emails e
    using public.recaps r
    where e.recap_id = r.id and r.child_id = child.id and r.kind = p_kind
      and r.period_start = first_day;

    insert into public.recaps (
      child_id, kind, period_start, period_end, content, test_parent_id, created_at
    )
    values (
      child.id, p_kind, first_day, final_day,
      case p_kind
        when 'weekly' then private.weekly_recap(child.id, first_day, p_now)
        else private.monthly_recap(child.id, first_day, p_now)
      end,
      parent.id, p_now
    )
    on conflict (child_id, kind, period_start) do update
      set period_end = excluded.period_end, content = excluded.content, advice = null,
        pdf_path = null, delivered_at = null, attempts = 0, last_error = null,
        created_at = excluded.created_at, test_parent_id = excluded.test_parent_id
      where public.recaps.test_parent_id is not null
    returning id into sent_recap;

    if parent.wants_push then
      insert into public.notifications (
        family_id, child_id, audience, kind, recipient_id, dedup_key, title, body, url, created_at
      )
      select child.family_id, child.id, 'parent', (p_kind::text || '_recap')::public.notification_kind,
        parent.user_id, concat_ws(':', p_kind::text || '_recap', 'test', r.id, gen_random_uuid()),
        content.title, content.body, '/parent/children/' || child.id || '/progress', p_now
      from public.recaps r
      cross join lateral private.recap_notification_content(
        p_kind, child.display_name, child.language, r.content
      ) content
      where r.id = sent_recap;
      notified := notified + 1;
    end if;

    done_recaps := done_recaps || jsonb_build_object(
      'child', child.display_name,
      'from', first_day,
      'to', final_day,
      'sessions', (
        select count(*) from public.sessions s
        where s.child_id = child.id and s.local_date between first_day and final_day
      )
    );
  end loop;

  select count(*) into phones from public.push_tokens t where t.user_id = parent.user_id;
  has_secrets := exists (select 1 from vault.decrypted_secrets where name = 'project_url')
    and exists (select 1 from vault.decrypted_secrets where name = 'service_role_key');

  perform private.send_notifications(p_now);
  if jsonb_array_length(done_recaps) > 0 then
    perform private.request_recaps();
  end if;

  return jsonb_build_object(
    'parent', parent.display_name,
    'kind', p_kind,
    'recaps', done_recaps,
    'skipped', skipped,
    'notification', case
      when not parent.wants_push then 'turned_off'
      when notified = 0 then 'nothing_to_send'
      when phones = 0 then 'no_push_token'
      else 'sent'
    end,
    'phones', phones,
    'email', case
      when not parent.wants_email then 'turned_off'
      when jsonb_array_length(done_recaps) = 0 then 'nothing_to_send'
      when not has_secrets then 'no_vault_secrets'
      else 'requested'
    end,
    'email_to', parent.address
  );
end;
$$;

revoke all on function private.send_recap_now(text, public.recap_kind, boolean, timestamptz)
  from public;
