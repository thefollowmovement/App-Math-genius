-- Parents follow sessions live (phase 4). Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(1);

-- Realtime forwards these changes to parents, filtered by the table's RLS policies (tested in
-- practice_sessions.test.sql: a parent reads their own children's sessions only).
select ok(
  exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sessions'
  ),
  'Session changes are published to Realtime'
);

select * from finish();
rollback;
