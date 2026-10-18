-- Phase 5: the world map's bosses. A boss is a short session (kind 'boss') on every skill of one
-- island: the domain of a grade (packages/exercise-engine/src/adaptive/islands.ts). The server
-- regrades it like any session; beaten with 80 % of right answers (BOSS_PASS_RATE in
-- packages/shared/src/rewards.ts) on at least 6 exercises, it completes the island.
--
-- The device chooses the exercises; the server checks that they all come from one island. That
-- the island's skills were mastered first is the app's rule (the boss only opens then).

create table public.island_completions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  grade public.grade not null,
  domain public.skill_domain not null,
  session_id uuid references public.sessions (id) on delete set null,
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, grade, domain)
);

create trigger island_completions_updated_at before update on public.island_completions
  for each row execute function private.set_updated_at();

alter table public.island_completions enable row level security;

create policy "Parents and devices read their children's islands" on public.island_completions
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

-- Written by award_session only; no insert, update or delete policy exists.

-- The boss of a session: its island, whether it was beaten, and whether for the first time.
-- Null when the exercises come from several islands (not a boss the app plans).
create function private.settle_boss(p_session public.sessions, p_now timestamptz)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  pass_rate constant numeric := 0.8;
  min_exercises constant integer := 6;
  island record;
  islands integer;
  passed boolean;
  first boolean := false;
begin
  select count(*) into islands from (
    select distinct k.grade, k.domain
    from public.attempts a
    join public.skills k on k.code = a.skill_code
    where a.session_id = p_session.id
  ) distinct_islands;
  if islands <> 1 then
    return null;
  end if;
  select k.grade, k.domain into island
  from public.attempts a
  join public.skills k on k.code = a.skill_code
  where a.session_id = p_session.id
  limit 1;

  passed := p_session.answered >= min_exercises
    and coalesce(p_session.verified_correct, 0) >= pass_rate * p_session.answered;
  if passed then
    insert into public.island_completions (child_id, grade, domain, session_id, completed_at)
    values (p_session.child_id, island.grade, island.domain, p_session.id, p_now)
    on conflict (child_id, grade, domain) do nothing
    returning true into first;
  end if;
  return jsonb_build_object(
    'grade', island.grade, 'domain', island.domain, 'passed', passed,
    'first', coalesce(first, false)
  );
end;
$$;

-- Badge measures: those of the badges migration, plus islands and bosses.
alter function private.badge_metrics(uuid) rename to session_badge_metrics;

create function private.badge_metrics(p_child_id uuid) returns jsonb
language sql stable
set search_path = ''
as $$
  select private.session_badge_metrics(p_child_id) || jsonb_build_object(
    'islands_completed',
      (select count(*) from public.island_completions i where i.child_id = p_child_id),
    'perfect_bosses', (select count(*) from public.sessions s
      where s.child_id = p_child_id and s.kind = 'boss' and s.awarded_at is not null
        and s.answered >= 6 and s.verified_correct = s.answered)
  );
$$;

-- A boss is settled before the badges, which count completed islands.
create or replace function private.award_extras(p_session public.sessions, p_now timestamptz)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  boss jsonb;
begin
  if p_session.kind = 'boss' then
    boss := private.settle_boss(p_session, p_now);
  end if;
  -- Only a boss session's award says how its boss went.
  return jsonb_build_object(
    'badges', to_jsonb(private.grant_badges(p_session.child_id, p_session.id, p_now))
  ) || case when boss is null then '{}'::jsonb else jsonb_build_object('boss', boss) end;
end;
$$;

insert into public.badges (code, category, metric, threshold, position) values
  ('island-1', 'progression', 'islands_completed', 1, 38),
  ('island-2', 'progression', 'islands_completed', 2, 39),
  ('island-4', 'progression', 'islands_completed', 4, 40),
  ('boss-perfect', 'discovery', 'perfect_bosses', 1, 41);

revoke all on function private.settle_boss(public.sessions, timestamptz) from public;
revoke all on function private.badge_metrics(uuid) from public;
