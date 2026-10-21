-- Phase 7c: the coach's cache, settings, prompts, costs and feedback, and who may touch them.
-- Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

-- Eva (editor), Mo (moderator), Sam (super-admin); Alice's Léa (CM1, personalization on) and Bob's
-- Hugo (CE2, off), each with a device.
insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000f1', 'authenticated', 'authenticated', 'sam@team.example', '{}', false),
  ('00000000-0000-4000-8000-0000000000f2', 'authenticated', 'authenticated', 'eva@team.example', '{}', false),
  ('00000000-0000-4000-8000-0000000000f3', 'authenticated', 'authenticated', 'mo@team.example', '{}', false),
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'bob@example.com',
   '{"display_name": "Bob", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', null, '{}', true),
  ('00000000-0000-4000-8000-0000000000d2', 'authenticated', 'authenticated', null, '{}', true);
select private.grant_admin('sam@team.example', 'super_admin');
select private.grant_admin('eva@team.example', 'editor');
select private.grant_admin('mo@team.example', 'moderator');

insert into public.children (id, family_id, display_name, gender, grade, personalization_consent_at,
  personalization_consent_version)
select '00000000-0000-4000-8000-0000000000c1', p.family_id, 'Léa', 'girl', 'CM1', now(), '2026-10'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';
insert into public.children (id, family_id, display_name, gender, grade)
select '00000000-0000-4000-8000-0000000000c2', p.family_id, 'Hugo', 'boy', 'CE2'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000b1';
insert into public.devices (id, user_id, family_id, platform)
select v.id, v.user_id, p.family_id, 'ios'
from (values
  ('00000000-0000-4000-8000-0000000000e1'::uuid, '00000000-0000-4000-8000-0000000000d1'::uuid,
   '00000000-0000-4000-8000-0000000000a1'::uuid),
  ('00000000-0000-4000-8000-0000000000e2'::uuid, '00000000-0000-4000-8000-0000000000d2'::uuid,
   '00000000-0000-4000-8000-0000000000b1'::uuid)) as v (id, user_id, parent)
join public.parents p on p.user_id = v.parent;
insert into public.device_children (device_id, child_id)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1'),
  ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000c2');
-- Fortnite (from 5e) is kept for Léa only to check that the coach leaves it out.
insert into public.child_interests (child_id, universe_id, question_id, source)
values ('00000000-0000-4000-8000-0000000000c1', 'football', 'sport', 'questionnaire'),
  ('00000000-0000-4000-8000-0000000000c1', 'minecraft', 'games', 'questionnaire'),
  ('00000000-0000-4000-8000-0000000000c1', 'fortnite', 'games', 'questionnaire'),
  ('00000000-0000-4000-8000-0000000000c2', 'minecraft', 'games', 'questionnaire');

-- A wrong answer of Léa's yesterday, with its mistake.
insert into public.sessions (id, child_id, kind, local_date, started_at, completed_at, goal_type, goal_value)
values ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-0000000000c1', 'daily',
  current_date - 1, now() - interval '1 day', now() - interval '1 day' + interval '15 minutes',
  'duration', 15);
insert into public.attempts (session_id, child_id, position, skill_code, generator_id, difficulty,
  seed, slot, answer, is_correct, time_ms, answered_at, learner_elo, verified, error_type)
values ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-0000000000c1', 0,
  'cm1.perimetre', 'cm1.perimetre', 2, 4, 'current', '{"type": "numeric", "text": "28"}', false,
  9000, now() - interval '1 day', 1200, false, 'area-perimeter');

-- What the gateway reads ------------------------------------------------------------------------------

select ok(
  (select enabled and realtime_provider ->> 'kind' = 'mistral' and night_provider is null
   from public.ai_settings),
  'The coach starts on, with the Mistral API and no server of our own'
);
select is(
  (select version from public.ai_prompts where task = 'explain' and active),
  1,
  'The first prompt is the active one'
);
select ok(
  (select context ->> 'grade' = 'CM1'
     and context -> 'universes' -> 0 ->> 'id' = 'minecraft'
     and jsonb_array_length(context -> 'universes') = 2
     and context #>> '{prompt,version}' = '1'
     and context -> 'banned' ? 'idiot'
     and context #>> '{spent,today}' = '0'
   from (select public.coach_context('00000000-0000-4000-8000-0000000000c1') as context) c),
  'The gateway gets the grade, the universes allowed in the questionnaire''s order, prompt and banned words'
);
select is(
  (select public.coach_context('00000000-0000-4000-8000-0000000000c2') -> 'universes'),
  '[]'::jsonb,
  'Without the parent''s consent, no universe: everyday examples'
);

-- The cache ---------------------------------------------------------------------------------------

create temp table saved as
select public.coach_save_explanation('cm1.perimetre', 'area-perimeter', 'minecraft', 'cm1-cm2',
    '{"what": "a", "image": "b", "tip": "c"}', 'ministral-8b-latest', 1) as id
union all
select public.coach_save_explanation('cm1.perimetre', 'area-perimeter', 'minecraft', 'cm1-cm2',
    '{"what": "d", "image": "e", "tip": "f"}', 'ministral-8b-latest', 1)
union all
select public.coach_save_explanation('cm1.perimetre', 'area-perimeter', 'minecraft', 'cm1-cm2',
    '{"what": "g", "image": "h", "tip": "i"}', 'ministral-8b-latest', 1);
create temp table ids as select id, row_number() over () as n from saved;
grant select on saved, ids to authenticated;

update public.explanations set status = 'approved' where id = (select id from ids where n = 2);
update public.explanations set status = 'rejected' where id = (select id from ids where n = 3);
select is(
  (select array_agg(content ->> 'what') from public.coach_cached('cm1.perimetre', 'area-perimeter',
    'minecraft', 'cm1-cm2')),
  array['d', 'a'],
  'The cache serves the approved explanation first, never a rejected one'
);
select is(
  (select array_agg(content ->> 'what') from public.coach_cached('cm1.perimetre', 'area-perimeter',
    'minecraft', 'cm1-cm2', array[(select id from ids where n = 2)])),
  array['a'],
  '« Explique autrement » leaves out what was already shown'
);
select is(
  (select count(*)::int from public.coach_cached('cm1.perimetre', null, 'minecraft', 'cm1-cm2')),
  0,
  'Another mistake has its own explanations'
);

select lives_ok(
  $$ select public.coach_log_usage('{"task": "realtime", "provider": "mistral", "model": "ministral-8b-latest",
       "tokens_in": 600, "tokens_out": 200, "cost_usd": 0.00012, "latency_ms": 900, "outcome": "ok",
       "child_id": "00000000-0000-4000-8000-0000000000c1", "skill_code": "cm1.perimetre",
       "grade_band": "cm1-cm2", "prompt_version": 1}') $$,
  'The gateway logs each call'
);
select lives_ok(
  $$ select public.coach_log_usage('{"task": "realtime", "provider": "mistral", "model": "ministral-8b-latest",
       "cost_usd": 0.0001, "outcome": "rejected", "problems": ["digits"]}') $$,
  'and the explanations the checks refused'
);
select is(
  (select (private.ai_spent() ->> 'today')::numeric),
  0.00022,
  'What was spent today is the sum of the calls'
);
select ok(
  (public.coach_night_plan() -> 'occurrences') @> '[{"band": "cm1-cm2", "skill": "cm1.perimetre", "error": "area-perimeter", "count": 1}]'
    and (public.coach_night_plan() -> 'existing') ? 'cm1.perimetre|area-perimeter|minecraft|cm1-cm2',
  'The night knows the mistakes made and the explanations already written'
);
select lives_ok(
  $$ select public.coach_log_usage('{"task": "night", "provider": "openai-compatible", "model": "ministral-8b",
       "outcome": "rejected", "problems": ["digits"], "skill_code": "cm1.perimetre",
       "grade_band": "cm1-cm2", "prompt_version": 1}') $$,
  'The night logs what it tried'
);
select ok(
  (select (plan ->> 'remaining')::int = 49 and (plan -> 'existing') ? 'cm1.perimetre|||cm1-cm2'
   from (select public.coach_night_plan() as plan) p),
  'The next run knows what is left of the night''s batch and does not try a combination again'
);
select ok(
  (select context #>> '{universe,name}' = 'Minecraft' and context #>> '{settings,enabled}' = 'true'
   from (select public.coach_preview_context('minecraft') as context) c),
  'A prompt test gets the settings and the universe to use'
);
delete from vault.secrets where name in ('project_url', 'service_role_key');
select is(private.request_coach_night(), null, 'Without the Vault secrets, the night job does nothing');

-- Children ------------------------------------------------------------------------------------------

set local role authenticated;
create function pg_temp.as_user(id text, anonymous boolean default false) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object(
    'sub', id, 'role', 'authenticated', 'is_anonymous', anonymous)::text, true);
$$;

select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select throws_ok(
  $$ select public.coach_context('00000000-0000-4000-8000-0000000000c1') $$,
  '42501', null,
  'A device cannot read what the gateway reads'
);
select throws_ok(
  $$ select public.coach_preview_context('minecraft') $$,
  '42501', null,
  'nor try a prompt'
);
select is((select count(*)::int from public.explanations), 0, 'A device reads no explanation directly');
select lives_ok(
  $$ select public.coach_feedback('00000000-0000-4000-8000-0000000000c1',
       (select id from ids where n = 2), true) $$,
  'The child says « J''ai compris »'
);
select pg_temp.as_user('00000000-0000-4000-8000-0000000000d2', true);
select throws_ok(
  $$ select public.coach_feedback('00000000-0000-4000-8000-0000000000c1',
       (select id from ids where n = 2), true) $$,
  'PT404', 'child_not_found',
  'Another family''s device cannot speak for Léa'
);

-- The back-office -----------------------------------------------------------------------------------

select pg_temp.as_user('00000000-0000-4000-8000-0000000000f3');
select is(
  (select understood_count from public.explanations where id = (select id from ids where n = 2)),
  1,
  'A moderator sees how well each explanation is understood'
);
select lives_ok(
  $$ select public.admin_review_explanation((select id from ids where n = 1), 'rejected') $$,
  'A moderator rejects an explanation'
);
reset role;
select is(
  (select count(*)::int from public.coach_cached('cm1.perimetre', 'area-perimeter', 'minecraft', 'cm1-cm2')),
  1,
  'A rejected explanation is no longer served'
);
set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000f3');
select lives_ok(
  $$ insert into public.ai_banned_words (word) values ('gros nul') $$,
  'A moderator adds a banned word'
);
select is(
  (select count(*)::int from public.ai_settings where enabled),
  1,
  'Every admin reads the settings'
);
update public.ai_settings set enabled = false;
select is(
  (select count(*)::int from public.ai_settings where enabled),
  1,
  'Only the super-admin changes them'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000f2');
insert into public.ai_prompts (task, version, system, user_template, notes)
values ('explain', 2, 'Système', 'Utilisateur {{exercice}}', 'Plus court');
select public.admin_activate_prompt((select id from public.ai_prompts where version = 2));
select is(
  (select array_agg(version order by version) from public.ai_prompts where active),
  array[2],
  'An editor makes a new version of the prompt the active one'
);
select ok(
  (select (costs -> 'days' -> 0 ->> 'calls')::int = 3 and (costs -> 'days' -> 0 ->> 'rejected')::int = 2
   from (select public.admin_ai_costs(7) as costs) c),
  'An editor reads the costs per day'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000f1');
update public.ai_settings set enabled = false, daily_cap_usd = 1;
select is(
  (select enabled from public.ai_settings),
  false,
  'The super-admin cuts the AI with the emergency switch'
);

select * from finish();
rollback;
