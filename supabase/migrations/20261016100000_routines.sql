-- Phase 4: daily routines and holidays, set by parents.
--
-- One routine per child: active weekdays, start time (another one possible on Wednesdays and at
-- the weekend), deadline and session goal, as times of the family's day. Holidays suspend it.
-- private.day_plan applies the same rules as dayPlan in packages/shared/src/routine.ts.

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null unique references public.children (id) on delete cascade,
  -- ISO weekdays: 1 = Monday … 7 = Sunday.
  days smallint[] not null
    check (cardinality(days) between 1 and 7 and days <@ '{1,2,3,4,5,6,7}'::smallint[]),
  start_time time not null,
  wednesday_start_time time,
  weekend_start_time time,
  -- Past it, a planned day without a finished session is missed.
  deadline_time time not null,
  -- As in packages/shared/src/routine.ts: DURATION_GOALS (minutes) and COUNT_GOALS (exercises).
  goal_type public.session_goal_type not null,
  goal_value smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    deadline_time > start_time
    and deadline_time > coalesce(wednesday_start_time, start_time)
    and deadline_time > coalesce(weekend_start_time, start_time)
  ),
  check (
    (goal_type = 'duration' and goal_value in (10, 15, 20))
    or (goal_type = 'count' and goal_value in (10, 15, 20, 30))
  )
);

-- Both days included; at most 92 days (MAX_VACATION_DAYS), the summer break.
create table public.vacations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  from_date date not null,
  to_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (to_date >= from_date and to_date - from_date < 92)
);
create index vacations_child_id_to_date_idx on public.vacations (child_id, to_date);

create trigger routines_updated_at before update on public.routines
  for each row execute function private.set_updated_at();
create trigger vacations_updated_at before update on public.vacations
  for each row execute function private.set_updated_at();

-- Access ---------------------------------------------------------------------------------------------

-- Children of the signed-in parent's family; none for devices.
create function private.parent_child_ids() returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select c.id from public.children c where c.family_id = (select private.parent_family_id());
$$;

revoke all on function private.parent_child_ids() from public;
grant execute on function private.parent_child_ids() to authenticated;

alter table public.routines enable row level security;
alter table public.vacations enable row level security;

-- Devices read their child's routine to set the session goal, offline included.
create policy "Parents and devices read their children's routines" on public.routines
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

create policy "Parents set their children's routines" on public.routines
  for insert to authenticated
  with check (child_id in (select private.parent_child_ids()));

create policy "Parents change their children's routines" on public.routines
  for update to authenticated
  using (child_id in (select private.parent_child_ids()))
  with check (child_id in (select private.parent_child_ids()));

create policy "Parents remove their children's routines" on public.routines
  for delete to authenticated
  using (child_id in (select private.parent_child_ids()));

create policy "Parents and devices read their children's holidays" on public.vacations
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

create policy "Parents add holidays for their children" on public.vacations
  for insert to authenticated
  with check (child_id in (select private.parent_child_ids()));

create policy "Parents remove their children's holidays" on public.vacations
  for delete to authenticated
  using (child_id in (select private.parent_child_ids()));

-- Day plan -----------------------------------------------------------------------------------------

-- Start and deadline of a child's session on a day of their family's calendar; no row without a
-- routine, on a day off or during holidays. For the server reminders, not exposed to clients.
create function private.day_plan(p_child_id uuid, p_date date)
returns table (start_time time, deadline_time time)
language sql stable security definer
set search_path = ''
as $$
  select
    case
      when extract(isodow from p_date) = 3 and r.wednesday_start_time is not null
        then r.wednesday_start_time
      when extract(isodow from p_date) in (6, 7) and r.weekend_start_time is not null
        then r.weekend_start_time
      else r.start_time
    end,
    r.deadline_time
  from public.routines r
  where r.child_id = p_child_id
    and extract(isodow from p_date)::smallint = any (r.days)
    and not exists (
      select 1 from public.vacations v
      where v.child_id = p_child_id and p_date between v.from_date and v.to_date
    );
$$;

revoke all on function private.day_plan(uuid, date) from public;
