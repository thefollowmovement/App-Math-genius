-- Phase 7c: the team's back-office (docs/specs.md, Back-office d'administration, apps/admin).
--
-- Admins are Supabase users with a role in admin_users: super-admin (everything), pedagogical
-- editor (contents, prompts, trends) and moderator (AI review, « Autre » answers). They are created
-- in the dashboard (no parent metadata, so no family) and given a role once with
-- private.grant_admin, in the SQL editor. Every change to what admins manage is logged with who,
-- when, before and after (admin_audit_log).

create type public.admin_role as enum ('super_admin', 'editor', 'moderator');

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.admin_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  -- Null: a change by the server itself (night job, migration).
  admin_id uuid references auth.users (id) on delete set null,
  entity text not null,
  entity_id text,
  action text not null check (action in ('insert', 'update', 'delete')),
  before jsonb,
  after jsonb,
  at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index admin_audit_log_at_idx on public.admin_audit_log (at desc);

create trigger admin_users_updated_at before update on public.admin_users
  for each row execute function private.set_updated_at();
create trigger admin_audit_log_updated_at before update on public.admin_audit_log
  for each row execute function private.set_updated_at();

-- The signed-in admin's role; null for everyone else.
create function private.admin_role() returns public.admin_role
language sql stable security definer
set search_path = ''
as $$
  select a.role from public.admin_users a where a.user_id = (select auth.uid());
$$;

-- Whether the caller is an admin with one of these roles; a super-admin always is.
create function private.is_admin(p_roles public.admin_role[] default null) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(
    (select a.role = 'super_admin' or p_roles is null or a.role = any (p_roles)
     from public.admin_users a where a.user_id = (select auth.uid())),
    false
  );
$$;

revoke all on function private.admin_role() from public;
revoke all on function private.is_admin(public.admin_role[]) from public;
grant execute on function private.admin_role() to authenticated;
grant execute on function private.is_admin(public.admin_role[]) to authenticated;

alter table public.admin_users enable row level security;
alter table public.admin_audit_log enable row level security;

create policy "Admins read the team" on public.admin_users
  for select to authenticated
  using ((select private.is_admin()));

create policy "Super-admins read the change log" on public.admin_audit_log
  for select to authenticated
  using ((select private.is_admin('{super_admin}')));

-- Who changed what, before and after: on every table admins manage.
create function private.audit_admin_change() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  old_row jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  new_row jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  row_id text := coalesce(new_row, old_row) ->> coalesce(tg_argv[0], 'id');
begin
  if tg_op = 'UPDATE' and (old_row - 'updated_at') = (new_row - 'updated_at') then
    return new;
  end if;
  insert into public.admin_audit_log (admin_id, entity, entity_id, action, before, after)
  values ((select auth.uid()), tg_table_name, row_id, lower(tg_op), old_row, new_row);
  return coalesce(new, old);
end;
$$;
revoke all on function private.audit_admin_change() from public;

create trigger admin_users_audit after insert or update or delete on public.admin_users
  for each row execute function private.audit_admin_change('user_id');

-- Bootstrap, from the SQL editor only: the first super-admin.
create function private.grant_admin(p_email text, p_role public.admin_role) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  found uuid;
begin
  select u.id into found from auth.users u where lower(u.email) = lower(btrim(p_email));
  if found is null then
    raise exception 'user_not_found' using errcode = 'PT404';
  end if;
  insert into public.admin_users (user_id, role) values (found, p_role)
  on conflict (user_id) do update set role = excluded.role;
  return found;
end;
$$;
revoke all on function private.grant_admin(text, public.admin_role) from public;

-- The team, with emails, for the super-admin (auth.users stays closed to the API).
create function public.admin_team()
returns table (user_id uuid, email text, role public.admin_role, created_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select a.user_id, u.email::text, a.role, a.created_at
  from public.admin_users a
  join auth.users u on u.id = a.user_id
  where (select private.is_admin('{super_admin}'))
  order by a.created_at;
$$;

-- The super-admin gives a role to a user who has an account, or removes it (null).
create function public.admin_set_role(p_email text, p_role public.admin_role)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  found uuid;
begin
  if not (select private.is_admin('{super_admin}')) then
    raise exception 'admin_only' using errcode = 'PT403';
  end if;
  select u.id into found from auth.users u where lower(u.email) = lower(btrim(p_email));
  if found is null then
    raise exception 'user_not_found' using errcode = 'PT404';
  end if;
  if found = (select auth.uid()) then
    raise exception 'own_role' using errcode = 'PT409';
  end if;
  if p_role is null then
    delete from public.admin_users where user_id = found;
  else
    insert into public.admin_users (user_id, role) values (found, p_role)
    on conflict (user_id) do update set role = excluded.role;
  end if;
end;
$$;

-- What the admin app shows of the signed-in user: their role, null when not an admin.
create function public.admin_whoami() returns public.admin_role
language sql stable security definer
set search_path = ''
as $$
  select private.admin_role();
$$;

revoke all on function public.admin_team() from public, anon;
revoke all on function public.admin_set_role(text, public.admin_role) from public, anon;
revoke all on function public.admin_whoami() from public, anon;
grant execute on function public.admin_team() to authenticated;
grant execute on function public.admin_set_role(text, public.admin_role) to authenticated;
grant execute on function public.admin_whoami() to authenticated;

-- The coach's age group of a grade (packages/shared/src/grade-bands.ts).
create function private.grade_band(p_grade public.grade) returns text
language sql immutable
set search_path = ''
as $$
  select case
    when p_grade in ('CP', 'CE1', 'CE2') then 'cp-ce2'
    when p_grade in ('CM1', 'CM2') then 'cm1-cm2'
    when p_grade in ('6e', '5e') then '6e-5e'
    else '4e-3e'
  end;
$$;
revoke all on function private.grade_band(public.grade) from public;

-- Trends and « Ton univers », managed by the pedagogical editors ----------------------------------

create policy "Admins read every universe" on public.universes
  for select to authenticated
  using ((select private.is_admin()));
create policy "Editors add universes" on public.universes
  for insert to authenticated
  with check ((select private.is_admin('{editor}')));
create policy "Editors change universes" on public.universes
  for update to authenticated
  using ((select private.is_admin('{editor}')))
  with check ((select private.is_admin('{editor}')));
create policy "Editors delete universes" on public.universes
  for delete to authenticated
  using ((select private.is_admin('{editor}')));

create policy "Admins read every question" on public.interest_questions
  for select to authenticated
  using ((select private.is_admin()));
create policy "Editors add questions" on public.interest_questions
  for insert to authenticated
  with check ((select private.is_admin('{editor}')));
create policy "Editors change questions" on public.interest_questions
  for update to authenticated
  using ((select private.is_admin('{editor}')))
  with check ((select private.is_admin('{editor}')));

create policy "Editors add choices" on public.interest_options
  for insert to authenticated
  with check ((select private.is_admin('{editor}')));
create policy "Editors change choices" on public.interest_options
  for update to authenticated
  using ((select private.is_admin('{editor}')))
  with check ((select private.is_admin('{editor}')));
create policy "Editors remove choices" on public.interest_options
  for delete to authenticated
  using ((select private.is_admin('{editor}')));

create trigger universes_audit after insert or update or delete on public.universes
  for each row execute function private.audit_admin_change();
create trigger interest_questions_audit after insert or update or delete on public.interest_questions
  for each row execute function private.audit_admin_change();
create trigger interest_options_audit after insert or update or delete on public.interest_options
  for each row execute function private.audit_admin_change('universe_id');

-- Radar of the trends: choices per age group and month, never a child. -------------------------

create function public.admin_interest_counts(p_months integer default 6)
returns table (universe_id text, grade_band text, month date, children integer)
language sql stable security definer
set search_path = ''
as $$
  select i.universe_id,
    private.grade_band(c.grade),
    date_trunc('month', i.answered_at)::date,
    count(distinct i.child_id)::integer
  from public.child_interests i
  join public.children c on c.id = i.child_id
  where (select private.is_admin('{editor,moderator}'))
    and i.answered_at >= date_trunc('month', now()) - make_interval(months => greatest(p_months, 1) - 1)
  group by 1, 2, 3;
$$;

-- « Autre » answers to review: the text, its question and age group, never the child.
create function public.admin_other_answers(p_status public.moderation_status default 'pending')
returns table (
  id uuid,
  question_id text,
  answer text,
  status public.moderation_status,
  grade_band text,
  created_at timestamptz
)
language sql stable security definer
set search_path = ''
as $$
  select o.id, o.question_id, o.answer, o.status, private.grade_band(c.grade), o.created_at
  from public.interest_other_answers o
  join public.children c on c.id = o.child_id
  where (select private.is_admin('{editor,moderator}')) and o.status = p_status
  order by o.created_at desc
  limit 500;
$$;

create function public.admin_review_other(p_id uuid, p_status public.moderation_status)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin('{editor,moderator}')) then
    raise exception 'admin_only' using errcode = 'PT403';
  end if;
  update public.interest_other_answers set status = p_status where id = p_id;
  insert into public.admin_audit_log (admin_id, entity, entity_id, action, after)
  values ((select auth.uid()), 'interest_other_answers', p_id::text, 'update',
    jsonb_build_object('status', p_status));
end;
$$;

revoke all on function public.admin_interest_counts(integer) from public, anon;
revoke all on function public.admin_other_answers(public.moderation_status) from public, anon;
revoke all on function public.admin_review_other(uuid, public.moderation_status) from public, anon;
grant execute on function public.admin_interest_counts(integer) to authenticated;
grant execute on function public.admin_other_answers(public.moderation_status) to authenticated;
grant execute on function public.admin_review_other(uuid, public.moderation_status) to authenticated;
