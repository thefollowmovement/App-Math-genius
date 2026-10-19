-- Phase 4: parents follow their children's sessions as they happen.
--
-- The device syncs a session after every answer (sync_session); publishing the table lets a
-- parent's app receive those changes through Supabase Realtime. Realtime applies the table's
-- RLS policies, so a parent only receives their own children's sessions.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.sessions;
  end if;
end;
$$;
