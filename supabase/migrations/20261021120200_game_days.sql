-- Phase 9b × phase 9: a mini-game round is not the day's session. As in *_statistics.sql, but a
-- day with rounds only is neither done nor started (childDay in apps/mobile/src/data/
-- session-report.ts leaves them out the same way); their time, answers and XP still count.

create or replace function private.child_days(p_child_id uuid, p_from date, p_to date, p_now timestamptz)
returns table (
  local_date date,
  plan text,
  due boolean,
  status text,
  seconds integer,
  answered integer,
  correct integer,
  xp integer
)
language sql stable security definer
set search_path = ''
as $$
  with child as (
    select c.id, (p_now at time zone f.timezone) as local_now,
      (select (r.created_at at time zone f.timezone)::date
       from public.routines r where r.child_id = c.id) as routine_from
    from public.children c
    join public.families f on f.id = c.family_id
    where c.id = p_child_id
  ),
  plans as (
    select d.day::date as local_date, child.local_now, p.deadline_time,
      case
        when child.routine_from is null or d.day::date < child.routine_from then 'none'
        when exists (
          select 1 from public.vacations v
          where v.child_id = child.id and d.day::date between v.from_date and v.to_date
        ) then 'vacation'
        when p.deadline_time is not null then 'planned'
        else 'off'
      end as plan
    from generate_series(p_from, p_to, interval '1 day') as d (day)
    cross join child
    left join lateral private.day_plan(child.id, d.day::date) p on true
  ),
  played as (
    select s.local_date,
      bool_or(s.kind not in ('placement', 'game') and s.completed_at is not null) as done,
      bool_or(s.kind not in ('placement', 'game')) as started,
      sum(s.duration_s)::integer as seconds,
      coalesce(sum(s.xp_awarded), 0)::integer as xp
    from public.sessions s
    where s.child_id = p_child_id and s.local_date between p_from and p_to
    group by s.local_date
  ),
  answers as (
    select s.local_date, count(*)::integer as answered,
      (count(*) filter (where coalesce(a.verified, a.is_correct)))::integer as correct
    from public.attempts a
    join public.sessions s on s.id = a.session_id
    where s.child_id = p_child_id and s.kind <> 'placement'
      and s.local_date between p_from and p_to
    group by s.local_date
  ),
  days as (
    select pl.*, coalesce(pd.done, false) as done, coalesce(pd.started, false) as started,
      pl.plan = 'planned' and (pl.local_date < pl.local_now::date
        or (pl.local_date = pl.local_now::date and pl.local_now::time >= pl.deadline_time)) as due,
      coalesce(pd.seconds, 0) as seconds, coalesce(an.answered, 0) as answered,
      coalesce(an.correct, 0) as correct, coalesce(pd.xp, 0) as xp
    from plans pl
    left join played pd on pd.local_date = pl.local_date
    left join answers an on an.local_date = pl.local_date
  )
  select d.local_date, d.plan, d.due,
    case
      when d.done then 'done'
      when d.started then 'started'
      when d.due then 'missed'
      when d.plan in ('off', 'vacation') then d.plan
      when d.plan = 'planned' then 'pending'
      else 'none'
    end,
    d.seconds, d.answered, d.correct, d.xp
  from days d
  order by d.local_date;
$$;

revoke all on function private.child_days(uuid, date, date, timestamptz) from public;
