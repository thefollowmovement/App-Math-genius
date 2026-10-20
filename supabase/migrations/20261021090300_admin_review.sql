-- Phase 7c: what the back-office needs on top of the coach's tables.

-- Games filtered by age (docs/specs.md, garde-fous): never PEGI 16 or 18, PEGI 12 at collège from 5e
-- only. Now that editors add references themselves, the database holds the rule.
alter table public.universes add constraint universes_pegi_grades check (
  pegi is null or pegi < 12 or (pegi = 12 and grades <@ '{5e,4e,3e}'::public.grade[])
);

-- The moderation log: what the checks refused or the models failed, for moderators and editors.
-- Never the child (ai_usage keeps their id for the costs only).
create function public.admin_moderation_log(p_limit integer default 200)
returns table (
  id uuid,
  created_at timestamptz,
  task text,
  provider text,
  model text,
  outcome text,
  problems text[],
  skill_code text,
  error_type text,
  universe_id text,
  grade_band text,
  prompt_version integer
)
language sql stable security definer
set search_path = ''
as $$
  select u.id, u.created_at, u.task, u.provider, u.model, u.outcome, u.problems, u.skill_code,
    u.error_type, u.universe_id, u.grade_band, u.prompt_version
  from public.ai_usage u
  where (select private.is_admin('{editor,moderator}')) and u.outcome <> 'ok'
  order by u.created_at desc
  limit least(greatest(p_limit, 1), 1000);
$$;
revoke all on function public.admin_moderation_log(integer) from public, anon;
grant execute on function public.admin_moderation_log(integer) to authenticated;
