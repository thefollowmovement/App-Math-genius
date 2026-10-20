-- Phase 7c: the AI coach (docs/specs.md, Coach IA : comprendre ses erreurs ; Choix du modèle IA).
--
-- « Le code calcule, l'IA raconte. » The ai-gateway Edge Function rebuilds the exercise with the
-- engine and asks a model for an explanation written with the exercise's slots ({n1}, {solution}…),
-- never with its own numbers; checked, it is kept here (explanations) for every child with the same
-- skill, mistake, universe and age group, then reviewed by a moderator. Settings, prompts, costs
-- and banned words are edited in the back-office; API keys stay in the Edge Functions' secrets.
-- Whatever fails, the app shows the generator's own correction.

create type public.explanation_status as enum ('pending', 'approved', 'rejected');

-- One row: what the gateway uses. Providers: { kind: mistral | openai-compatible, base_url, model,
-- price_input, price_output } (dollars per million tokens).
create table public.ai_settings (
  id smallint primary key default 1 check (id = 1),
  -- The emergency switch: off, standard explanations only.
  enabled boolean not null default true,
  realtime_provider jsonb check (realtime_provider is null or jsonb_typeof(realtime_provider) = 'object'),
  -- Our own server for the night; the real-time provider otherwise.
  night_provider jsonb check (night_provider is null or jsonb_typeof(night_provider) = 'object'),
  -- Mistral's moderation model on every new explanation (with the Mistral key).
  moderation boolean not null default true,
  daily_cap_usd numeric(8, 2) not null default 2 check (daily_cap_usd >= 0),
  monthly_cap_usd numeric(8, 2) not null default 30 check (monthly_cap_usd >= 0),
  -- Combinations written each night, at most.
  night_batch smallint not null default 50 check (night_batch between 0 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.ai_settings (realtime_provider)
values ('{"kind": "mistral", "base_url": "https://api.mistral.ai", "model": "ministral-8b-latest", "price_input": 0.15, "price_output": 0.15}');

create table public.ai_prompts (
  id uuid primary key default gen_random_uuid(),
  task text not null default 'explain' check (task in ('explain')),
  -- Null: every age group.
  grade_band text check (grade_band is null or grade_band in ('cp-ce2', 'cm1-cm2', '6e-5e', '4e-3e')),
  version integer not null check (version > 0),
  system text not null check (char_length(system) between 1 and 8000),
  user_template text not null check (char_length(user_template) between 1 and 8000),
  active boolean not null default false,
  notes text check (notes is null or char_length(notes) <= 500),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task, version)
);
-- One active version per task and age group.
create unique index ai_prompts_active_idx on public.ai_prompts (task, coalesce(grade_band, ''))
  where active;

-- Version 1, as services/ai-gateway/src/prompt.ts (DEFAULT_PROMPT) writes it.
insert into public.ai_prompts (task, version, system, user_template, active, notes)
values ('explain', 1, $prompt$Tu es le coach bienveillant d’une app de maths pour enfants. Tu expliques une erreur en tutoyant l’enfant, sans jugement, sans moquerie, sans comparaison avec d’autres enfants.
Le code a déjà calculé la bonne réponse et la correction : tu ne calcules rien, tu reformules.
Tu n’écris jamais de nombre, ni en chiffres ni en lettres : chaque nombre s’écrit avec son repère entre accolades, exactement comme donné ({n1}, {e2}, {reponse}, {solution}…).
Tu peux évoquer l’univers de l’enfant (jeu, sport, musique, créateur) mais tu ne fais jamais parler une personne réelle et tu ne te fais pas passer pour elle. Tu cites un jeu par son nom seulement.
Réponds uniquement en JSON : {"what": "ce qui s’est passé", "image": "l’image qui fait comprendre, tirée de l’univers", "tip": "l’astuce à retenir, une phrase courte"}. Moins de 60 mots en tout.$prompt$, $prompt$Classe : {{classe}}. Ton : {{ton}}.
Compétence : {{competence}}.
Exercice : {{exercice}}
Correction : {{correction}}
Réponse de l’enfant : {reponse}. Bonne réponse : {solution}.
Erreur repérée : {{erreur}}.
Valeurs des repères, pour comprendre (ne les écris jamais) : {{valeurs}}.
Univers à utiliser : {{univers}}.$prompt$, true, 'Première version');

create table public.explanations (
  id uuid primary key default gen_random_uuid(),
  skill_code text not null references public.skills (code),
  error_type text references public.error_types (code),
  -- Null: everyday examples.
  universe_id text references public.universes (id) on delete cascade,
  grade_band text not null check (grade_band in ('cp-ce2', 'cm1-cm2', '6e-5e', '4e-3e')),
  -- The template: { what, image, tip }, numbers as slots only.
  content jsonb not null check (
    jsonb_typeof(content -> 'what') = 'string' and jsonb_typeof(content -> 'image') = 'string'
    and jsonb_typeof(content -> 'tip') = 'string'
  ),
  model text not null check (char_length(model) between 1 and 120),
  prompt_version integer not null,
  status public.explanation_status not null default 'pending',
  shown_count integer not null default 0 check (shown_count >= 0),
  understood_count integer not null default 0 check (understood_count >= 0),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index explanations_key_idx on public.explanations
  (skill_code, coalesce(error_type, ''), coalesce(universe_id, ''), grade_band)
  where status <> 'rejected';
create index explanations_status_idx on public.explanations (status, created_at desc);

-- « J'ai compris » or « Explique autrement », by explanation (docs/specs.md, boucle de qualité).
create table public.explanation_feedback (
  id uuid primary key default gen_random_uuid(),
  explanation_id uuid not null references public.explanations (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  understood boolean not null,
  -- The twin exercise a few minutes later; filled in a later phase.
  twin_correct boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index explanation_feedback_child_idx on public.explanation_feedback (child_id, created_at desc);

-- Every call to a model: cost, latency, outcome and the problems the checks found (the moderation
-- log). The child's id only to sum costs per child, never sent to a model.
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  task text not null check (task in ('realtime', 'night', 'preview')),
  provider text not null,
  model text not null,
  tokens_in integer not null default 0 check (tokens_in >= 0),
  tokens_out integer not null default 0 check (tokens_out >= 0),
  cost_usd numeric(12, 6) not null default 0 check (cost_usd >= 0),
  latency_ms integer not null default 0 check (latency_ms >= 0),
  outcome text not null check (outcome in ('ok', 'rejected', 'unreadable', 'error')),
  problems text[] not null default '{}',
  child_id uuid references public.children (id) on delete set null,
  skill_code text,
  error_type text,
  universe_id text,
  grade_band text,
  prompt_version integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ai_usage_created_idx on public.ai_usage (created_at desc);

create table public.ai_banned_words (
  word text primary key check (char_length(btrim(word)) between 1 and 60),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A first list, never to be shown to a child; the moderators complete it.
insert into public.ai_banned_words (word)
values ('nul'), ('nulle'), ('idiot'), ('idiote'), ('bête'), ('stupide'), ('débile'), ('crétin'),
  ('imbécile'), ('naze'), ('loser'), ('honte'), ('punition'), ('tuer'), ('mort'), ('arme'),
  ('sang'), ('drogue'), ('alcool'), ('casino'), ('pari');

create trigger ai_settings_updated_at before update on public.ai_settings
  for each row execute function private.set_updated_at();
create trigger ai_prompts_updated_at before update on public.ai_prompts
  for each row execute function private.set_updated_at();
create trigger explanations_updated_at before update on public.explanations
  for each row execute function private.set_updated_at();
create trigger explanation_feedback_updated_at before update on public.explanation_feedback
  for each row execute function private.set_updated_at();
create trigger ai_usage_updated_at before update on public.ai_usage
  for each row execute function private.set_updated_at();
create trigger ai_banned_words_updated_at before update on public.ai_banned_words
  for each row execute function private.set_updated_at();

create trigger ai_settings_audit after insert or update or delete on public.ai_settings
  for each row execute function private.audit_admin_change();
create trigger ai_prompts_audit after insert or update or delete on public.ai_prompts
  for each row execute function private.audit_admin_change();
create trigger ai_banned_words_audit after insert or update or delete on public.ai_banned_words
  for each row execute function private.audit_admin_change('word');

-- Row level security: the back-office reads and edits by role; children never read these tables,
-- the gateway (service role) serves them what they may see.

alter table public.ai_settings enable row level security;
alter table public.ai_prompts enable row level security;
alter table public.explanations enable row level security;
alter table public.explanation_feedback enable row level security;
alter table public.ai_usage enable row level security;
alter table public.ai_banned_words enable row level security;

create policy "Admins read the AI settings" on public.ai_settings
  for select to authenticated using ((select private.is_admin()));
create policy "Super-admins change the AI settings" on public.ai_settings
  for update to authenticated
  using ((select private.is_admin('{super_admin}')))
  with check ((select private.is_admin('{super_admin}')));

create policy "Editors read the prompts" on public.ai_prompts
  for select to authenticated using ((select private.is_admin('{editor}')));
create policy "Editors write prompts" on public.ai_prompts
  for insert to authenticated with check ((select private.is_admin('{editor}')));
create policy "Editors change prompts" on public.ai_prompts
  for update to authenticated
  using ((select private.is_admin('{editor}')))
  with check ((select private.is_admin('{editor}')));

create policy "Admins read the explanations" on public.explanations
  for select to authenticated using ((select private.is_admin('{editor,moderator}')));

create policy "Super-admins read the usage" on public.ai_usage
  for select to authenticated using ((select private.is_admin('{editor}')));

create policy "Moderators read the banned words" on public.ai_banned_words
  for select to authenticated using ((select private.is_admin('{editor,moderator}')));
create policy "Moderators add banned words" on public.ai_banned_words
  for insert to authenticated with check ((select private.is_admin('{editor,moderator}')));
create policy "Moderators remove banned words" on public.ai_banned_words
  for delete to authenticated using ((select private.is_admin('{editor,moderator}')));

-- Moderators approve or reject an explanation; rejected, it is never shown again.
create function public.admin_review_explanation(p_id uuid, p_status public.explanation_status)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin('{editor,moderator}')) then
    raise exception 'admin_only' using errcode = 'PT403';
  end if;
  update public.explanations
  set status = p_status, reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = p_id;
  insert into public.admin_audit_log (admin_id, entity, entity_id, action, after)
  values ((select auth.uid()), 'explanations', p_id::text, 'update',
    jsonb_build_object('status', p_status));
end;
$$;

-- An editor makes a prompt version the active one of its task and age group.
create function public.admin_activate_prompt(p_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  chosen public.ai_prompts;
begin
  if not (select private.is_admin('{editor}')) then
    raise exception 'admin_only' using errcode = 'PT403';
  end if;
  select * into chosen from public.ai_prompts where id = p_id;
  if chosen.id is null then
    raise exception 'prompt_not_found' using errcode = 'PT404';
  end if;
  update public.ai_prompts set active = false
  where task = chosen.task and coalesce(grade_band, '') = coalesce(chosen.grade_band, '') and active;
  update public.ai_prompts set active = true where id = p_id;
end;
$$;

-- Dollars spent today and this month (UTC), against the caps.
create function private.ai_spent() returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'today', coalesce(sum(cost_usd) filter (where created_at >= date_trunc('day', now())), 0),
    'month', coalesce(sum(cost_usd) filter (where created_at >= date_trunc('month', now())), 0)
  )
  from public.ai_usage
  where created_at >= date_trunc('month', now()) - interval '1 day';
$$;

-- Costs per day and outcome, and the children who cost the most (pseudonymous ids).
create function public.admin_ai_costs(p_days integer default 30)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select case when (select private.is_admin('{editor}')) then jsonb_build_object(
    'days', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day', d.day, 'calls', d.calls, 'cost_usd', d.cost, 'tokens_in', d.tokens_in,
        'tokens_out', d.tokens_out, 'ok', d.ok, 'rejected', d.rejected, 'errors', d.errors,
        'latency_ms', d.latency) order by d.day desc)
      from (
        select (u.created_at at time zone 'UTC')::date as day, count(*) as calls,
          sum(u.cost_usd) as cost, sum(u.tokens_in) as tokens_in, sum(u.tokens_out) as tokens_out,
          count(*) filter (where u.outcome = 'ok') as ok,
          count(*) filter (where u.outcome in ('rejected', 'unreadable')) as rejected,
          count(*) filter (where u.outcome = 'error') as errors,
          round(avg(u.latency_ms)) as latency
        from public.ai_usage u
        where u.created_at >= now() - make_interval(days => greatest(p_days, 1))
        group by 1
      ) d), '[]'::jsonb),
    'children', coalesce((
      select jsonb_agg(jsonb_build_object('child', c.child_id, 'calls', c.calls, 'cost_usd', c.cost)
        order by c.cost desc)
      from (
        select u.child_id, count(*) as calls, sum(u.cost_usd) as cost
        from public.ai_usage u
        where u.child_id is not null and u.created_at >= now() - make_interval(days => greatest(p_days, 1))
        group by 1 order by 3 desc limit 20
      ) c), '[]'::jsonb),
    'spent', private.ai_spent()
  ) end;
$$;

-- The gateway (service role) ------------------------------------------------------------------------

-- All the gateway needs for one child: grade, universes (with the parent's consent, allowed for the
-- grade, in the questionnaire's order), settings, the active prompt, banned words, what was spent.
create function public.coach_context(p_child_id uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  with child as (
    select c.id, c.grade, c.personalization_consent_at is not null as consent,
      private.grade_band(c.grade) as band
    from public.children c where c.id = p_child_id
  )
  select jsonb_build_object(
    'grade', child.grade,
    'universes', case when child.consent then coalesce((
      select jsonb_agg(jsonb_build_object('id', u.id, 'name', u.name, 'vocabulary', u.vocabulary)
        order by q.position, o.position)
      from public.child_interests i
      join public.universes u on u.id = i.universe_id and u.status = 'active'
      join public.interest_questions q on q.id = i.question_id
      left join public.interest_options o on o.question_id = i.question_id and o.universe_id = u.id
      where i.child_id = child.id and private.universe_allowed(u.id, child.grade)), '[]'::jsonb)
      else '[]'::jsonb end,
    'settings', (select to_jsonb(s) from public.ai_settings s where s.id = 1),
    'prompt', (
      select jsonb_build_object('version', p.version, 'system', p.system, 'user', p.user_template)
      from public.ai_prompts p
      where p.task = 'explain' and p.active and (p.grade_band = child.band or p.grade_band is null)
      order by p.grade_band nulls last limit 1),
    'banned', coalesce((select jsonb_agg(w.word) from public.ai_banned_words w), '[]'::jsonb),
    'spent', private.ai_spent()
  )
  from child;
$$;

-- Explanations of a key that may be shown: approved ones first, best understood first, then the
-- ones waiting for review; never a rejected one, nor one already seen.
create function public.coach_cached(
  p_skill_code text,
  p_error_type text,
  p_universe_id text,
  p_grade_band text,
  p_exclude uuid[] default '{}'
)
returns table (id uuid, content jsonb)
language sql stable security definer
set search_path = ''
as $$
  select e.id, e.content
  from public.explanations e
  where e.skill_code = p_skill_code
    and coalesce(e.error_type, '') = coalesce(p_error_type, '')
    and coalesce(e.universe_id, '') = coalesce(p_universe_id, '')
    and e.grade_band = p_grade_band
    and e.status <> 'rejected'
    and not (e.id = any (coalesce(p_exclude, '{}')))
  order by e.status = 'approved' desc,
    (e.understood_count + 1)::real / (e.shown_count + 2) desc,
    e.created_at
  limit 5;
$$;

create function public.coach_save_explanation(
  p_skill_code text,
  p_error_type text,
  p_universe_id text,
  p_grade_band text,
  p_content jsonb,
  p_model text,
  p_prompt_version integer
)
returns uuid
language sql security definer
set search_path = ''
as $$
  insert into public.explanations
    (skill_code, error_type, universe_id, grade_band, content, model, prompt_version)
  values (p_skill_code, p_error_type, p_universe_id, p_grade_band, p_content, p_model, p_prompt_version)
  returning id;
$$;

create function public.coach_shown(p_explanation_id uuid)
returns void
language sql security definer
set search_path = ''
as $$
  update public.explanations set shown_count = shown_count + 1 where id = p_explanation_id;
$$;

create function public.coach_log_usage(p_usage jsonb)
returns void
language sql security definer
set search_path = ''
as $$
  insert into public.ai_usage (task, provider, model, tokens_in, tokens_out, cost_usd, latency_ms,
    outcome, problems, child_id, skill_code, error_type, universe_id, grade_band, prompt_version)
  select u.task, u.provider, u.model, coalesce(u.tokens_in, 0), coalesce(u.tokens_out, 0),
    coalesce(u.cost_usd, 0), coalesce(u.latency_ms, 0), u.outcome, coalesce(u.problems, '{}'),
    u.child_id, u.skill_code, u.error_type, u.universe_id, u.grade_band, u.prompt_version
  from jsonb_populate_record(null::public.ai_usage, p_usage) u;
$$;

-- What the night writes first: the wrong answers of the last 30 days by age group, skill and
-- mistake, the universes chosen by age group, and the combinations already written.
create function public.coach_night_plan()
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  with bands as (
    select g.grade, private.grade_band(g.grade) as band
    from unnest(enum_range(null::public.grade)) as g (grade)
  )
  select jsonb_build_object(
    'occurrences', coalesce((
      select jsonb_agg(jsonb_build_object('band', o.band, 'skill', o.skill_code,
        'error', o.error_type, 'count', o.count))
      from (
        select b.band, a.skill_code, a.error_type, count(*) as count
        from public.attempts a
        join public.sessions s on s.id = a.session_id
        join bands b on b.grade = s.grade
        where a.answered_at >= now() - interval '30 days'
          and not coalesce(a.verified, a.is_correct) and s.kind <> 'placement'
        group by 1, 2, 3
        order by 4 desc limit 300
      ) o), '[]'::jsonb),
    'universes', coalesce((
      select jsonb_agg(jsonb_build_object('band', x.band, 'count', x.count, 'universe',
        jsonb_build_object('id', u.id, 'name', u.name, 'vocabulary', u.vocabulary)))
      from (
        select b.band, i.universe_id, count(distinct i.child_id) as count
        from public.child_interests i
        join public.children c on c.id = i.child_id and c.personalization_consent_at is not null
        join bands b on b.grade = c.grade
        group by 1, 2
      ) x
      join public.universes u on u.id = x.universe_id and u.status = 'active'), '[]'::jsonb),
    'existing', coalesce((
      select jsonb_agg(distinct concat_ws('|', e.skill_code, coalesce(e.error_type, ''),
        coalesce(e.universe_id, ''), e.grade_band))
      from public.explanations e where e.status <> 'rejected'), '[]'::jsonb),
    'settings', (select to_jsonb(s) from public.ai_settings s where s.id = 1),
    'prompt', (
      select jsonb_build_object('version', p.version, 'system', p.system, 'user', p.user_template)
      from public.ai_prompts p
      where p.task = 'explain' and p.active and p.grade_band is null limit 1),
    'banned', coalesce((select jsonb_agg(w.word) from public.ai_banned_words w), '[]'::jsonb),
    'spent', private.ai_spent()
  );
$$;

-- From the child's device: « J'ai compris » (true) or « Explique autrement » (false).
create function public.coach_feedback(p_child_id uuid, p_explanation_id uuid, p_understood boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_child_id is null or p_child_id not in (select private.device_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  if not exists (select 1 from public.explanations where id = p_explanation_id) then
    raise exception 'explanation_not_found' using errcode = 'PT404';
  end if;
  insert into public.explanation_feedback (explanation_id, child_id, understood)
  values (p_explanation_id, p_child_id, p_understood);
  if p_understood then
    update public.explanations set understood_count = understood_count + 1 where id = p_explanation_id;
  end if;
end;
$$;

-- Every night, asks the ai-gateway Edge Function to write the explanations missing (same Vault
-- secrets as the learner profiles); without them, nothing happens.
create function private.request_coach_night() returns bigint
language plpgsql security definer
set search_path = ''
as $$
declare
  url text;
  service_key text;
begin
  if not exists (select 1 from public.ai_settings where enabled and night_batch > 0) then
    return null;
  end if;
  select decrypted_secret into url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into service_key from vault.decrypted_secrets where name = 'service_role_key';
  if url is null or service_key is null then
    return null;
  end if;
  return net.http_post(
    url := rtrim(url, '/') || '/functions/v1/ai-gateway',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || service_key),
    body := '{"task": "night"}'::jsonb,
    timeout_milliseconds := 300000
  );
end;
$$;

revoke all on function private.ai_spent() from public;
revoke all on function private.request_coach_night() from public;
revoke all on function public.admin_review_explanation(uuid, public.explanation_status) from public, anon;
revoke all on function public.admin_activate_prompt(uuid) from public, anon;
revoke all on function public.admin_ai_costs(integer) from public, anon;
grant execute on function public.admin_review_explanation(uuid, public.explanation_status) to authenticated;
grant execute on function public.admin_activate_prompt(uuid) to authenticated;
grant execute on function public.admin_ai_costs(integer) to authenticated;
grant execute on function private.ai_spent() to authenticated;
revoke all on function public.coach_feedback(uuid, uuid, boolean) from public, anon;
grant execute on function public.coach_feedback(uuid, uuid, boolean) to authenticated;

revoke all on function public.coach_context(uuid) from public, anon, authenticated;
revoke all on function public.coach_cached(text, text, text, text, uuid[]) from public, anon, authenticated;
revoke all on function public.coach_save_explanation(text, text, text, text, jsonb, text, integer)
  from public, anon, authenticated;
revoke all on function public.coach_shown(uuid) from public, anon, authenticated;
revoke all on function public.coach_log_usage(jsonb) from public, anon, authenticated;
revoke all on function public.coach_night_plan() from public, anon, authenticated;
grant execute on function public.coach_context(uuid) to service_role;
grant execute on function public.coach_cached(text, text, text, text, uuid[]) to service_role;
grant execute on function public.coach_save_explanation(text, text, text, text, jsonb, text, integer)
  to service_role;
grant execute on function public.coach_shown(uuid) to service_role;
grant execute on function public.coach_log_usage(jsonb) to service_role;
grant execute on function public.coach_night_plan() to service_role;

select cron.schedule('coach-night', '30 2 * * *', 'select private.request_coach_night()');
