-- Phase 1: parent accounts, child profiles, paired child devices.
--
-- Parents sign in with email and password. A child device signs in anonymously, then redeems a
-- short-lived pairing code created by a parent; RLS gives it access to the paired children only.

create schema if not exists private;
grant usage on schema private to authenticated;

create type public.parent_role as enum ('owner', 'co_parent');
create type public.child_gender as enum ('girl', 'boy');
create type public.grade as enum ('CP', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e');
create type public.device_platform as enum ('ios', 'android', 'web');

create function private.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tables -----------------------------------------------------------------------------------------

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text check (char_length(name) between 1 and 60),
  plan text not null default 'free' check (plan in ('free', 'premium')),
  timezone text not null default 'Europe/Paris',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  role public.parent_role not null default 'owner',
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  -- GDPR: the parent consents for their children when creating the account.
  privacy_consent_at timestamptz not null,
  privacy_consent_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index parents_family_id_idx on public.parents (family_id);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 30),
  gender public.child_gender not null,
  grade public.grade not null,
  birth_year smallint check (birth_year between 2000 and 2100),
  theme_id text not null default 'kawaii',
  avatar jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index children_family_id_idx on public.children (family_id);

-- One row per child device, keyed by its anonymous auth user.
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  platform public.device_platform not null,
  revoked_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index devices_family_id_idx on public.devices (family_id);

-- A device can carry several child profiles (shared tablet).
create table public.device_children (
  device_id uuid not null references public.devices (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (device_id, child_id)
);
create index device_children_child_id_idx on public.device_children (child_id);

create table public.pairing_codes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  -- 6 characters without look-alikes (no I, O, 0, 1), as PAIRING_CODE_ALPHABET in @math-genius/shared.
  code text not null check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by_device_id uuid references public.devices (id) on delete set null,
  created_by uuid not null references public.parents (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index pairing_codes_unused_code_idx on public.pairing_codes (code) where used_at is null;
create index pairing_codes_child_id_idx on public.pairing_codes (child_id);

create trigger families_updated_at before update on public.families
  for each row execute function private.set_updated_at();
create trigger parents_updated_at before update on public.parents
  for each row execute function private.set_updated_at();
create trigger children_updated_at before update on public.children
  for each row execute function private.set_updated_at();
create trigger devices_updated_at before update on public.devices
  for each row execute function private.set_updated_at();
create trigger pairing_codes_updated_at before update on public.pairing_codes
  for each row execute function private.set_updated_at();

-- Access helpers (security definer so policies do not recurse into RLS) --------------------------

-- Family of the signed-in parent, null for devices.
create function private.parent_family_id() returns uuid
language sql stable security definer
set search_path = ''
as $$
  select family_id from public.parents where user_id = (select auth.uid());
$$;

-- Children the signed-in device may access; none once the device is revoked.
create function private.device_child_ids() returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select dc.child_id
  from public.device_children dc
  join public.devices d on d.id = dc.device_id
  where d.user_id = (select auth.uid()) and d.revoked_at is null;
$$;

revoke all on function private.parent_family_id() from public;
revoke all on function private.device_child_ids() from public;
grant execute on function private.parent_family_id() to authenticated;
grant execute on function private.device_child_ids() to authenticated;

-- Row level security -----------------------------------------------------------------------------

alter table public.families enable row level security;
alter table public.parents enable row level security;
alter table public.children enable row level security;
alter table public.devices enable row level security;
alter table public.device_children enable row level security;
alter table public.pairing_codes enable row level security;

create policy "Parents read their family" on public.families
  for select to authenticated
  using (id = (select private.parent_family_id()));

create policy "Parents read their family's parents" on public.parents
  for select to authenticated
  using (family_id = (select private.parent_family_id()));

create policy "Parents read their children" on public.children
  for select to authenticated
  using (family_id = (select private.parent_family_id()));

create policy "Devices read their paired children" on public.children
  for select to authenticated
  using (id in (select private.device_child_ids()));

create policy "Parents add children to their family" on public.children
  for insert to authenticated
  with check (family_id = (select private.parent_family_id()));

create policy "Parents update their children" on public.children
  for update to authenticated
  using (family_id = (select private.parent_family_id()))
  with check (family_id = (select private.parent_family_id()));

create policy "Parents delete their children" on public.children
  for delete to authenticated
  using (family_id = (select private.parent_family_id()));

create policy "Parents read their family's devices" on public.devices
  for select to authenticated
  using (family_id = (select private.parent_family_id()));

create policy "Devices read themselves" on public.devices
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Parents and devices read device links" on public.device_children
  for select to authenticated
  using (
    exists (
      select 1 from public.devices d
      where d.id = device_id
        and (d.family_id = (select private.parent_family_id()) or d.user_id = (select auth.uid()))
    )
  );

create policy "Parents read their pairing codes" on public.pairing_codes
  for select to authenticated
  using (family_id = (select private.parent_family_id()));

-- Writes to parents, families, devices, device_children and pairing_codes go through the
-- functions below; no insert, update or delete policy exists for them.

-- Parent sign-up -----------------------------------------------------------------------------------

-- Creates the family and its owner when a parent signs up with consent in their metadata
-- (supabase.auth.signUp options.data). Anonymous device users are skipped.
create function private.handle_new_parent() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  new_family_id uuid;
begin
  if coalesce(new.is_anonymous, false)
    or coalesce(new.raw_user_meta_data ->> 'privacy_consent_version', '') = '' then
    return new;
  end if;

  insert into public.families default values returning id into new_family_id;

  insert into public.parents (user_id, family_id, role, display_name, privacy_consent_at, privacy_consent_version)
  values (
    new.id,
    new_family_id,
    'owner',
    btrim(new.raw_user_meta_data ->> 'display_name'),
    now(),
    new.raw_user_meta_data ->> 'privacy_consent_version'
  );

  return new;
end;
$$;

create trigger on_auth_user_created_parent
  after insert on auth.users
  for each row execute function private.handle_new_parent();

-- Pairing ------------------------------------------------------------------------------------------
-- Errors use PostgREST's PTxyz codes so that clients get HTTP status xyz instead of 500.

-- Creates a 6-character code valid for 10 minutes and invalidates the child's previous codes.
create function public.create_pairing_code(p_child_id uuid)
returns table (code text, expires_at timestamptz)
language plpgsql security definer
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  caller_parent public.parents;
  target_child public.children;
  random_bytes bytea;
  new_code text;
  attempt int := 0;
begin
  select * into caller_parent from public.parents where user_id = (select auth.uid());
  select * into target_child from public.children where id = p_child_id;

  if caller_parent.id is null or target_child.id is null
    or target_child.family_id <> caller_parent.family_id then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;

  delete from public.pairing_codes pc
  where pc.child_id = p_child_id and pc.used_at is null;

  loop
    attempt := attempt + 1;
    random_bytes := extensions.gen_random_bytes(6);
    new_code := '';
    for i in 0..5 loop
      -- 256 is a multiple of 32, so every character is equally likely.
      new_code := new_code || substr(alphabet, (get_byte(random_bytes, i) % 32) + 1, 1);
    end loop;

    begin
      insert into public.pairing_codes (family_id, child_id, code, expires_at, created_by)
      values (caller_parent.family_id, p_child_id, new_code, now() + interval '10 minutes', caller_parent.id)
      returning pairing_codes.code, pairing_codes.expires_at into code, expires_at;
      return next;
      return;
    exception when unique_violation then
      if attempt >= 5 then
        raise;
      end if;
    end;
  end loop;
end;
$$;

-- Links the calling anonymous device to the code's child. Every failure reads the same, so
-- the error does not reveal whether a code exists.
create function public.redeem_pairing_code(p_code text, p_platform public.device_platform)
returns table (child_id uuid, display_name text)
language plpgsql security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  pairing public.pairing_codes;
  device public.devices;
begin
  if caller_id is null or not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) then
    raise exception 'device_session_required' using errcode = 'PT403';
  end if;

  select * into pairing
  from public.pairing_codes pc
  where pc.code = upper(btrim(p_code)) and pc.used_at is null and pc.expires_at > now()
  for update;

  if pairing.id is null then
    raise exception 'invalid_pairing_code' using errcode = 'PT400';
  end if;

  select * into device from public.devices d where d.user_id = caller_id for update;

  if device.id is null then
    insert into public.devices (user_id, family_id, platform)
    values (caller_id, pairing.family_id, p_platform)
    returning * into device;
  elsif device.family_id <> pairing.family_id and device.revoked_at is null then
    raise exception 'device_in_other_family' using errcode = 'PT409';
  elsif device.revoked_at is not null then
    update public.devices d
    set family_id = pairing.family_id, revoked_at = null, platform = p_platform, last_seen_at = now()
    where d.id = device.id;
  else
    update public.devices d set last_seen_at = now() where d.id = device.id;
  end if;

  insert into public.device_children (device_id, child_id)
  values (device.id, pairing.child_id)
  on conflict do nothing;

  update public.pairing_codes pc
  set used_at = now(), used_by_device_id = device.id
  where pc.id = pairing.id;

  return query
  select c.id, c.display_name from public.children c where c.id = pairing.child_id;
end;
$$;

-- Cuts a device off: it keeps its row (marked revoked) but loses every child link.
create function public.revoke_device(p_device_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.devices d
  set revoked_at = now()
  where d.id = p_device_id
    and d.family_id = (select private.parent_family_id())
    and d.revoked_at is null;

  if not found then
    raise exception 'device_not_found' using errcode = 'PT404';
  end if;

  delete from public.device_children dc where dc.device_id = p_device_id;
end;
$$;

revoke all on function public.create_pairing_code(uuid) from public, anon;
revoke all on function public.redeem_pairing_code(text, public.device_platform) from public, anon;
revoke all on function public.revoke_device(uuid) from public, anon;
grant execute on function public.create_pairing_code(uuid) to authenticated;
grant execute on function public.redeem_pairing_code(text, public.device_platform) to authenticated;
grant execute on function public.revoke_device(uuid) to authenticated;
