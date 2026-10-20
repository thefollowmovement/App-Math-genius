-- Phase 7b: typical mistakes (docs/specs.md, diagnostic par le code).
--
-- The catalogue lives in packages/curriculum (error-types.ts) and is loaded with the skills by the
-- generated *_skills.sql migrations (`pnpm curriculum:sql`). The award-session Edge Function
-- regrades each answer with the engine, which also names the typical mistake behind a wrong one;
-- record_answer_errors stores it with the answer, for the learning profile.

create table public.error_types (
  -- Stable code, stored with every diagnosed answer: never rename one.
  code text primary key check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- How the parent and the coach read it, about the child (« oublie la retenue »).
  label text not null check (char_length(label) between 1 and 120),
  skills text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger error_types_updated_at before update on public.error_types
  for each row execute function private.set_updated_at();

alter table public.error_types enable row level security;

create policy "Signed-in users read the error types" on public.error_types
  for select to authenticated
  using (true);

-- Null: right answer, or a wrong one the engine cannot explain.
alter table public.attempts add column error_type text references public.error_types (code);
create index attempts_child_id_error_type_idx on public.attempts (child_id, error_type)
  where error_type is not null;

-- The engine's diagnosis of a session's answers ([{position, correct, error}], as regrade returns
-- them). Only wrong answers keep a mistake; codes this database does not know yet are left out.
create function public.record_answer_errors(p_session_id uuid, p_verdicts jsonb)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  update public.attempts a
  set error_type = case when v.correct = false then e.code end
  from jsonb_to_recordset(coalesce(p_verdicts, '[]')) as v (position smallint, correct boolean, error text)
  left join public.error_types e on e.code = v.error
  where a.session_id = p_session_id and a.position = v.position
    and a.error_type is distinct from (case when v.correct = false then e.code end);
  get diagnostics changed = row_count;
  return changed;
end;
$$;

revoke all on function public.record_answer_errors(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.record_answer_errors(uuid, jsonb) to service_role;
