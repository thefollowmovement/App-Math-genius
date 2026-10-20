-- Phase 7: the placement test. A test is a session of kind 'placement' (the kind exists since the
-- practice sessions): the device plays it with @math-genius/exercise-engine (placement.ts) and
-- syncs it with sync_session, mastery included, like any session. award_session gives it XP, and
-- no gems, chest or streak day, which only the daily session earns.
--
-- The parent's view computes the test's result again from its answers, against the grade the
-- child was in when taking it: each session now keeps that grade.

alter table public.sessions add column grade public.grade;

update public.sessions s
set grade = c.grade
from public.children c
where c.id = s.child_id;

alter table public.sessions alter column grade set not null;

-- The child's grade when the session is first recorded; a later change of grade leaves it as is.
create function private.set_session_grade() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.grade is null then
    select c.grade into new.grade from public.children c where c.id = new.child_id;
  end if;
  return new;
end;
$$;

create trigger sessions_grade before insert on public.sessions
  for each row execute function private.set_session_grade();

-- A placement test is not the day's session: it neither stops the reminders nor counts as started
-- (the streak only counts the daily session). A child taking it is still playing: no reminder
-- to the child meanwhile. As in *_reminders.sql, with the test left out.
create or replace function private.enqueue_reminders(p_now timestamptz default now())
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
          and s.completed_at is not null and s.kind <> 'placement'
      ) as finished,
      exists (
        select 1 from public.sessions s
        where s.child_id = pl.child_id and s.local_date = pl.local_date
          and s.kind <> 'placement'
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
