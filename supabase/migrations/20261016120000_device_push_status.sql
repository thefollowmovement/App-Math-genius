-- Phase 4: whether each child device can show notifications, so that its parent knows when
-- reminders and messages cannot reach it (refused, or a browser or test app without push, such
-- as Expo Go on Android). Reported by the device itself at startup.

create type public.push_status as enum ('enabled', 'denied', 'unsupported');

alter table public.devices
  add column push_status public.push_status,
  add column push_status_at timestamptz;

-- Called by a paired child device; does nothing for any other account. Readable through the
-- existing devices policies (parents of the family, the device itself).
create function public.report_push_status(p_status public.push_status)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.devices d
  set push_status = p_status, push_status_at = now()
  where d.user_id = (select auth.uid()) and d.revoked_at is null;
  return found;
end;
$$;

revoke all on function public.report_push_status(public.push_status) from public, anon;
grant execute on function public.report_push_status(public.push_status) to authenticated;
