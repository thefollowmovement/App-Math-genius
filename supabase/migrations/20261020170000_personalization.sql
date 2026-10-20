-- Phase 7b: universes and learning profile (docs/specs.md, Profil d'apprentissage évolutif).
--
-- Both are profiling of a minor: the parent consents to them separately, for each child
-- (children.personalization_consent_at). Without that consent nothing is asked, computed or kept:
-- withdrawing it deletes the child's interests and profile.
--
-- Universes (games, creators, sports, shows, music, jobs) are a catalogue the back-office will
-- manage; the questionnaire « Ton univers » offers those allowed for the child's grade (PEGI and
-- age, never GTA or Call of Duty). The child's answers are child_interests; a free « Autre » at
-- collège goes to interest_other_answers, for moderation, never to the coach as such.
--
-- The learning profile is computed by the exercise engine (learnerProfile, profileSummary) in the
-- learner-profiles and award-session Edge Functions: after each awarded session, and every night
-- for the others (pg_cron, through pg_net, with the project URL and service key kept in Vault).

create type public.universe_category as enum ('game', 'creator', 'sport', 'show', 'music', 'job');
create type public.universe_status as enum ('active', 'testing', 'retired');
create type public.interest_source as enum ('questionnaire', 'parent');
create type public.moderation_status as enum ('pending', 'approved', 'rejected');

alter table public.children
  add column personalization_consent_at timestamptz,
  add column personalization_consent_version text
    check (personalization_consent_version is null or char_length(personalization_consent_version) <= 20),
  -- Last time the child answered or skipped « Ton univers ».
  add column universe_asked_at timestamptz;

-- Catalogue --------------------------------------------------------------------------------------

create table public.universes (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 40),
  category public.universe_category not null,
  -- Grades it may be offered to and used for (PEGI and age).
  grades public.grade[] not null check (cardinality(grades) > 0),
  -- PEGI rating of a game, for the record; the grades decide.
  pegi smallint check (pegi in (3, 7, 12, 16, 18)),
  status public.universe_status not null default 'active',
  -- Words and mental images the coach may use: { "words": [...], "images": [...] }.
  vocabulary jsonb not null default '{}'::jsonb check (jsonb_typeof(vocabulary) = 'object'),
  -- Trends move fast: every reference is reviewed every 3 months.
  review_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interest_questions (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Asked to the child, in French (back-office content, like skill titles).
  title text not null check (char_length(title) between 1 and 80),
  category public.universe_category not null,
  grades public.grade[] not null check (cardinality(grades) > 0),
  position smallint not null,
  -- Grades where a free « Autre » answer is offered (collège).
  other_grades public.grade[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interest_options (
  question_id text not null references public.interest_questions (id) on delete cascade,
  universe_id text not null references public.universes (id) on delete cascade,
  -- A neutral drawing (emoji), never a brand logo.
  icon text not null check (char_length(icon) between 1 and 16),
  position smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (question_id, universe_id)
);

-- The child's choices -----------------------------------------------------------------------------

create table public.child_interests (
  child_id uuid not null references public.children (id) on delete cascade,
  universe_id text not null references public.universes (id) on delete cascade,
  question_id text not null references public.interest_questions (id) on delete cascade,
  source public.interest_source not null,
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (child_id, universe_id)
);
create index child_interests_question_idx on public.child_interests (child_id, question_id);

-- « Autre » at collège: kept for the back-office (new trends), moderated before any use.
create table public.interest_other_answers (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  question_id text not null references public.interest_questions (id) on delete cascade,
  answer text not null check (char_length(answer) between 1 and 40),
  status public.moderation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, question_id)
);

-- Learning profile --------------------------------------------------------------------------------

create table public.learner_profiles (
  child_id uuid primary key references public.children (id) on delete cascade,
  -- LearnerProfile of the engine: strengths, weaknesses, style.
  profile jsonb not null check (jsonb_typeof(profile) = 'object'),
  -- The compact summary sent to the coach's AI: no name, nothing identifying.
  summary text not null check (char_length(summary) <= 2000),
  computed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger universes_updated_at before update on public.universes
  for each row execute function private.set_updated_at();
create trigger interest_questions_updated_at before update on public.interest_questions
  for each row execute function private.set_updated_at();
create trigger interest_options_updated_at before update on public.interest_options
  for each row execute function private.set_updated_at();
create trigger child_interests_updated_at before update on public.child_interests
  for each row execute function private.set_updated_at();
create trigger interest_other_answers_updated_at before update on public.interest_other_answers
  for each row execute function private.set_updated_at();
create trigger learner_profiles_updated_at before update on public.learner_profiles
  for each row execute function private.set_updated_at();

-- Row level security: the catalogue is read by everyone signed in, the rest by the family. Writes go
-- through the functions below (and the back-office, with the service role).

alter table public.universes enable row level security;
alter table public.interest_questions enable row level security;
alter table public.interest_options enable row level security;
alter table public.child_interests enable row level security;
alter table public.interest_other_answers enable row level security;
alter table public.learner_profiles enable row level security;

create policy "Signed-in users read the universes in use" on public.universes
  for select to authenticated
  using (status <> 'retired');

create policy "Signed-in users read the active questions" on public.interest_questions
  for select to authenticated
  using (active);

create policy "Signed-in users read the options" on public.interest_options
  for select to authenticated
  using (true);

create policy "Families read their children's interests" on public.child_interests
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

create policy "Families read their children's other answers" on public.interest_other_answers
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

create policy "Families read their children's profiles" on public.learner_profiles
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

-- Consent ------------------------------------------------------------------------------------------

-- Withdrawn consent, whatever the way (this function, or the parent's own update of the child):
-- nothing the personalization collected is kept.
create function private.clear_personalization() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  delete from public.child_interests where child_id = new.id;
  delete from public.interest_other_answers where child_id = new.id;
  delete from public.learner_profiles where child_id = new.id;
  new.universe_asked_at := null;
  new.personalization_consent_version := null;
  return new;
end;
$$;

create trigger children_clear_personalization
  before update of personalization_consent_at on public.children
  for each row
  when (old.personalization_consent_at is not null and new.personalization_consent_at is null)
  execute function private.clear_personalization();

-- The parent turns personalization on (with the version of the text they read) or off.
create function public.set_personalization(p_child_id uuid, p_enabled boolean, p_version text default null)
returns timestamptz
language plpgsql security definer
set search_path = ''
as $$
declare
  consent timestamptz;
begin
  if not exists (
    select 1 from public.children c
    where c.id = p_child_id and c.family_id = (select private.parent_family_id())
  ) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  if p_enabled and (p_version is null or char_length(p_version) not between 1 and 20) then
    raise exception 'invalid_version' using errcode = 'PT400';
  end if;
  -- Agreeing again to the same text keeps the first consent; a new text dates a new one.
  update public.children c
  set personalization_consent_at = case
        when not p_enabled then null
        when c.personalization_consent_version = p_version then c.personalization_consent_at
        else now()
      end,
      personalization_consent_version = case when p_enabled then p_version end
  where c.id = p_child_id
  returning c.personalization_consent_at into consent;
  return consent;
end;
$$;

-- Questionnaire ------------------------------------------------------------------------------------

-- Universes a child of this grade may choose, or the coach may use.
create function private.universe_allowed(p_universe_id text, p_grade public.grade) returns boolean
language sql stable
set search_path = ''
as $$
  select exists (
    select 1 from public.universes u
    where u.id = p_universe_id and u.status <> 'retired' and p_grade = any (u.grades)
  );
$$;

-- The child's answers ([{question, universes: [ids], other}]): they replace the earlier answers
-- to the same questions. Called from the child's device (the questionnaire) or by the parent.
create function public.set_child_interests(p_child_id uuid, p_answers jsonb)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  child public.children;
  by_parent boolean;
  answer record;
  universe text;
  other text;
  kept integer := 0;
begin
  select * into child from public.children c
  where c.id = p_child_id and c.id in (select private.accessible_child_ids());
  if child.id is null then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  if child.personalization_consent_at is null then
    raise exception 'personalization_off' using errcode = 'PT409';
  end if;
  if jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'invalid_answers' using errcode = 'PT400';
  end if;
  by_parent := coalesce(child.family_id = (select private.parent_family_id()), false);

  for answer in
    select q.id, q.grades, q.other_grades, a.value -> 'universes' as universes,
      a.value ->> 'other' as other
    from jsonb_array_elements(p_answers) a
    left join public.interest_questions q on q.id = a.value ->> 'question' and q.active
  loop
    if answer.id is null or not (child.grade = any (answer.grades)) then
      raise exception 'invalid_question' using errcode = 'PT400';
    end if;
    delete from public.child_interests i where i.child_id = child.id and i.question_id = answer.id;
    for universe in
      select jsonb_array_elements_text(
        case when jsonb_typeof(answer.universes) = 'array' then answer.universes else '[]' end)
    loop
      if not exists (
        select 1 from public.interest_options o
        where o.question_id = answer.id and o.universe_id = universe
      ) or not private.universe_allowed(universe, child.grade) then
        raise exception 'invalid_universe' using errcode = 'PT400';
      end if;
      insert into public.child_interests (child_id, universe_id, question_id, source)
      values (child.id, universe, answer.id,
              case when by_parent then 'parent' else 'questionnaire' end::public.interest_source)
      on conflict (child_id, universe_id) do update
        set question_id = excluded.question_id, source = excluded.source, answered_at = now();
      kept := kept + 1;
    end loop;

    other := nullif(btrim(coalesce(answer.other, '')), '');
    if other is null then
      delete from public.interest_other_answers o
      where o.child_id = child.id and o.question_id = answer.id;
    elsif child.grade = any (answer.other_grades) then
      insert into public.interest_other_answers (child_id, question_id, answer)
      values (child.id, answer.id, left(other, 40))
      on conflict (child_id, question_id) do update
        set answer = excluded.answer, status = 'pending'
        where public.interest_other_answers.answer <> excluded.answer;
    end if;
  end loop;

  if not by_parent then
    update public.children c set universe_asked_at = now() where c.id = child.id;
  end if;
  return kept;
end;
$$;

-- « Plus tard » on the questionnaire: asked again in 3 months or at the next school year.
create function public.skip_universe(p_child_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_child_id is null or p_child_id not in (select private.device_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  update public.children c set universe_asked_at = now()
  where c.id = p_child_id and c.personalization_consent_at is not null;
end;
$$;

-- Learning profile (service role) -----------------------------------------------------------------

-- Everything the engine needs to compute a child's profile, as JSON: the child, the sessions of
-- the last 31 days and the latest placement test, their answers, the mastery records, the item
-- ratings and the names of the universes chosen (those still allowed for the child's grade).
-- Null without consent.
create function public.profile_input(p_child_id uuid, p_now timestamptz default now())
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  with child as (
    select c.id, c.grade, f.timezone
    from public.children c
    join public.families f on f.id = c.family_id
    where c.id = p_child_id and c.personalization_consent_at is not null
  ),
  chosen_sessions as (
    select s.* from public.sessions s, child
    where s.child_id = child.id
      and (s.started_at >= p_now - interval '31 days'
        or s.id = (
          select t.id from public.sessions t
          where t.child_id = child.id and t.kind = 'placement' and t.completed_at is not null
          order by t.started_at desc limit 1))
  )
  select jsonb_build_object(
    'child', jsonb_build_object('id', child.id, 'grade', child.grade, 'timezone', child.timezone),
    'sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'kind', s.kind, 'grade', s.grade, 'started_at', s.started_at,
        'completed_at', s.completed_at,
        'attempts', coalesce((
          select jsonb_agg(jsonb_build_object(
            'position', a.position, 'skill_code', a.skill_code, 'generator_id', a.generator_id,
            'difficulty', a.difficulty, 'slot', a.slot, 'twin_of', a.twin_of,
            'correct', coalesce(a.verified, a.is_correct), 'error_type', a.error_type,
            'time_ms', a.time_ms, 'answered_at', a.answered_at, 'learner_elo', a.learner_elo
          ) order by a.position)
          from public.attempts a where a.session_id = s.id), '[]'::jsonb)
      ) order by s.started_at)
      from chosen_sessions s), '[]'::jsonb),
    'mastery', coalesce((
      select jsonb_agg(jsonb_build_object(
        'skill_code', m.skill_code, 'elo', m.elo, 'attempts_count', m.attempts_count,
        'sessions_streak', m.sessions_streak, 'mastered_at', m.mastered_at,
        'last_practiced_at', m.last_practiced_at))
      from public.child_skill_mastery m where m.child_id = child.id), '[]'::jsonb),
    'item_ratings', coalesce((
      select jsonb_agg(jsonb_build_object(
        'generator_id', r.generator_id, 'difficulty', r.difficulty, 'rating', r.rating))
      from public.item_ratings r), '[]'::jsonb),
    'interests', coalesce((
      select jsonb_agg(u.name order by q.position, o.position)
      from public.child_interests i
      join public.universes u on u.id = i.universe_id
      join public.interest_questions q on q.id = i.question_id
      left join public.interest_options o on o.question_id = i.question_id and o.universe_id = u.id
      where i.child_id = child.id and private.universe_allowed(u.id, child.grade)), '[]'::jsonb)
  )
  from child;
$$;

-- Stores a profile the engine computed; nothing is kept once consent is withdrawn.
create function public.save_learner_profile(
  p_child_id uuid,
  p_profile jsonb,
  p_summary text,
  p_computed_at timestamptz default now()
)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.children c
    where c.id = p_child_id and c.personalization_consent_at is not null
  ) then
    return false;
  end if;
  insert into public.learner_profiles (child_id, profile, summary, computed_at)
  values (p_child_id, p_profile, p_summary, p_computed_at)
  on conflict (child_id) do update
    set profile = excluded.profile, summary = excluded.summary, computed_at = excluded.computed_at
    where public.learner_profiles.computed_at <= excluded.computed_at;
  return true;
end;
$$;

-- Children whose profile is due: consent given, and no profile computed in the last 20 hours.
create function public.profiles_due(p_limit integer default 100, p_now timestamptz default now())
returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select c.id
  from public.children c
  left join public.learner_profiles p on p.child_id = c.id
  where c.personalization_consent_at is not null
    and (p.computed_at is null or p.computed_at < p_now - interval '20 hours')
  order by p.computed_at nulls first, c.id
  limit greatest(1, least(p_limit, 500));
$$;

-- Every hour, asks the learner-profiles Edge Function to compute the profiles due. Its URL and the
-- service key come from Vault (secrets `project_url` and `service_role_key`, set once per project,
-- see CLAUDE.md); without them, nothing happens.
create function private.request_profile_refresh() returns bigint
language plpgsql security definer
set search_path = ''
as $$
declare
  url text;
  service_key text;
begin
  if not exists (select 1 from public.profiles_due(1)) then
    return null;
  end if;
  select decrypted_secret into url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into service_key from vault.decrypted_secrets where name = 'service_role_key';
  if url is null or service_key is null then
    return null;
  end if;
  return net.http_post(
    url := rtrim(url, '/') || '/functions/v1/learner-profiles',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;

revoke all on function private.clear_personalization() from public;
revoke all on function private.universe_allowed(text, public.grade) from public;
revoke all on function private.request_profile_refresh() from public;
revoke all on function public.set_personalization(uuid, boolean, text) from public, anon;
grant execute on function public.set_personalization(uuid, boolean, text) to authenticated;
revoke all on function public.set_child_interests(uuid, jsonb) from public, anon;
grant execute on function public.set_child_interests(uuid, jsonb) to authenticated;
revoke all on function public.skip_universe(uuid) from public, anon;
grant execute on function public.skip_universe(uuid) to authenticated;
revoke all on function public.profile_input(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.profile_input(uuid, timestamptz) to service_role;
revoke all on function public.save_learner_profile(uuid, jsonb, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.save_learner_profile(uuid, jsonb, text, timestamptz) to service_role;
revoke all on function public.profiles_due(integer, timestamptz) from public, anon, authenticated;
grant execute on function public.profiles_due(integer, timestamptz) to service_role;

select cron.schedule('refresh-learner-profiles', '20 * * * *', 'select private.request_profile_refresh()');
