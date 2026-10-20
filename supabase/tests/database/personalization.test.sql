-- Phase 7b: typical mistakes stored with the answers, the separate consent to personalization,
-- the questionnaire « Ton univers » and the learning profile. Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(34);

-- Alice's family (Léa, CM1; Noé, 6e) with Léa's device; Bob's family (Hugo, CE2).
insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'bob@example.com',
   '{"display_name": "Bob", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', null, '{}', true);

insert into public.children (id, family_id, display_name, gender, grade)
select v.id, p.family_id, v.name, v.gender::public.child_gender, v.grade::public.grade
from public.parents p, (values
  ('00000000-0000-4000-8000-0000000000c1'::uuid, 'Léa', 'girl', 'CM1'),
  ('00000000-0000-4000-8000-0000000000c2'::uuid, 'Noé', 'boy', '6e')) as v (id, name, gender, grade)
where p.user_id = '00000000-0000-4000-8000-0000000000a1';
insert into public.children (id, family_id, display_name, gender, grade)
select '00000000-0000-4000-8000-0000000000c3', p.family_id, 'Hugo', 'boy', 'CE2'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000b1';

insert into public.devices (id, user_id, family_id, platform)
select '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000d1',
  p.family_id, 'ios'
from public.parents p where p.user_id = '00000000-0000-4000-8000-0000000000a1';
insert into public.device_children (device_id, child_id)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1');

-- A finished session of Léa's: a forgotten carry, a right answer, a wrong one the engine cannot
-- explain.
insert into public.sessions (id, child_id, kind, local_date, started_at, completed_at, goal_type, goal_value)
values ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-0000000000c1', 'daily',
  '2026-10-19', '2026-10-19 17:00+00', '2026-10-19 17:15+00', 'duration', 15);
insert into public.attempts (session_id, child_id, position, skill_code, generator_id, difficulty,
  seed, slot, answer, is_correct, time_ms, answered_at, learner_elo)
select '00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-0000000000c1', p,
  'ce2.addition-posee', 'ce2.addition-posee', 2, 10 + p, 'current',
  '{"type": "numeric", "text": "75"}', p = 1, 8000, '2026-10-19 17:01+00'::timestamptz + p * interval '20 seconds', 1200
from generate_series(0, 2) p;

create function pg_temp.as_user(id text, anonymous boolean default false) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object(
    'sub', id, 'role', 'authenticated', 'is_anonymous', anonymous)::text, true);
$$;

-- Typical mistakes ---------------------------------------------------------------------------------

select ok(
  (select label = 'oublie la retenue' and skills @> array['ce2.addition-posee']
   from public.error_types where code = 'forgot-carry'),
  'The typical mistakes of the curriculum are loaded with their skills'
);

select is(
  public.record_answer_errors('00000000-0000-4000-8000-000000000701', '[
    {"position": 0, "correct": false, "error": "forgot-carry"},
    {"position": 1, "correct": true, "error": null},
    {"position": 2, "correct": false, "error": "not-a-known-code"}]'),
  1,
  'The server stores the mistake behind a wrong answer'
);
select is(
  (select array_agg(error_type order by position) from public.attempts
   where session_id = '00000000-0000-4000-8000-000000000701'),
  array['forgot-carry', null, null],
  'Right answers and unknown codes keep no mistake'
);

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select throws_ok(
  $$ select public.record_answer_errors('00000000-0000-4000-8000-000000000701', '[]') $$,
  '42501', null,
  'A device cannot write the diagnosis'
);
select is(
  (select error_type from public.attempts
   where session_id = '00000000-0000-4000-8000-000000000701' and position = 0),
  'forgot-carry',
  'The family reads the mistake with the answer'
);

-- Consent ------------------------------------------------------------------------------------------

select throws_ok(
  $$ select public.set_child_interests('00000000-0000-4000-8000-0000000000c1',
       '[{"question": "games", "universes": ["minecraft"]}]') $$,
  'PT409', 'personalization_off',
  'Nothing is asked before the parent consents'
);
select throws_ok(
  $$ select public.set_personalization('00000000-0000-4000-8000-0000000000c1', true, '2026-10') $$,
  'PT404', 'child_not_found',
  'Only the parent gives consent, not the child''s device'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select ok(
  public.set_personalization('00000000-0000-4000-8000-0000000000c1', true, '2026-10') is not null
    and public.set_personalization('00000000-0000-4000-8000-0000000000c2', true, '2026-10') is not null,
  'The parent turns personalization on for each child'
);
select throws_ok(
  $$ select public.set_personalization('00000000-0000-4000-8000-0000000000c3', true, '2026-10') $$,
  'PT404', 'child_not_found',
  'A parent cannot consent for another family''s child'
);

-- Questionnaire ------------------------------------------------------------------------------------

select ok(
  (select count(*) = 6 from public.interest_questions)
    and exists (select 1 from public.universes where id = 'fortnite' and pegi = 12
                and not ('CM1' = any (grades)) and '5e' = any (grades)),
  'The questionnaire asks 6 questions; Fortnite (PEGI 12) waits for 5e'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select is(
  public.set_child_interests('00000000-0000-4000-8000-0000000000c1', '[
    {"question": "games", "universes": ["minecraft", "roblox"], "other": "Zelda"},
    {"question": "sport", "universes": ["football"]}]'),
  3,
  'The child answers from the device'
);
select is(
  (select array_agg(universe_id || ':' || source order by universe_id)
   from public.child_interests where child_id = '00000000-0000-4000-8000-0000000000c1'),
  array['football:questionnaire', 'minecraft:questionnaire', 'roblox:questionnaire'],
  'The answers are kept as the child''s'
);
select is(
  (select count(*)::int from public.interest_other_answers),
  0,
  'No free answer before collège'
);
select ok(
  (select universe_asked_at is not null from public.children
   where id = '00000000-0000-4000-8000-0000000000c1'),
  'Answering dates the questionnaire, to ask again in 3 months'
);
select throws_ok(
  $$ select public.set_child_interests('00000000-0000-4000-8000-0000000000c1',
       '[{"question": "games", "universes": ["fortnite"]}]') $$,
  'PT400', 'invalid_universe',
  'A game not allowed for the child''s grade is refused'
);
select throws_ok(
  $$ select public.set_child_interests('00000000-0000-4000-8000-0000000000c1',
       '[{"question": "games", "universes": ["football"]}]') $$,
  'PT400', 'invalid_universe',
  'A universe is chosen under its own question'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select set_config('test.asked', (select universe_asked_at::text from public.children
  where id = '00000000-0000-4000-8000-0000000000c1'), true);
select is(
  public.set_child_interests('00000000-0000-4000-8000-0000000000c1',
    '[{"question": "games", "universes": ["pokemon"]}]'),
  1,
  'The parent changes an answer'
);
select is(
  (select array_agg(universe_id || ':' || source order by universe_id)
   from public.child_interests where child_id = '00000000-0000-4000-8000-0000000000c1'),
  array['football:questionnaire', 'pokemon:parent'],
  'The parent''s answer replaces the child''s for that question only'
);
select is(
  (select universe_asked_at::text from public.children where id = '00000000-0000-4000-8000-0000000000c1'),
  current_setting('test.asked'),
  'The parent''s change does not count as the child being asked'
);
select is(
  public.set_child_interests('00000000-0000-4000-8000-0000000000c2',
    '[{"question": "music", "universes": ["rap-fr"], "other": "  Un groupe de rock  "}]'),
  1,
  'At collège the questionnaire takes rap'
);
select is(
  (select answer || ':' || status from public.interest_other_answers
   where child_id = '00000000-0000-4000-8000-0000000000c2'),
  'Un groupe de rock:pending',
  'At collège a free answer waits for moderation'
);

select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select is(
  (select count(*)::int from public.child_interests),
  0,
  'Another family reads none of these answers'
);
select throws_ok(
  $$ select public.set_child_interests('00000000-0000-4000-8000-0000000000c1',
       '[{"question": "games", "universes": []}]') $$,
  'PT404', 'child_not_found',
  'Another family cannot change them'
);

-- Learning profile -------------------------------------------------------------------------------

select throws_ok(
  $$ select public.profile_input('00000000-0000-4000-8000-0000000000c1') $$,
  '42501', null,
  'Only the server reads a child''s whole history'
);

reset role;
select ok(
  (select input -> 'child' ->> 'grade' = 'CM1'
     and input -> 'child' ->> 'timezone' = 'Europe/Paris'
     and input #>> '{sessions,0,attempts,0,error_type}' = 'forgot-carry'
     and input #> '{sessions,0,attempts,1,correct}' = 'true'::jsonb
     and input -> 'interests' = '["Pokémon", "Foot"]'::jsonb
   from (select public.profile_input('00000000-0000-4000-8000-0000000000c1', '2026-10-20 03:00+00') as input) i),
  'The server gathers sessions, answers, mistakes and the universes chosen'
);
select is(
  public.profile_input('00000000-0000-4000-8000-0000000000c3'),
  null,
  'Nothing is gathered without consent'
);
select is(
  (select array_agg(id order by id) from public.profiles_due(10, '2026-10-20 03:00+00') id),
  array['00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000c2']::uuid[],
  'Profiles are due for the children whose parent consented'
);
select ok(
  public.save_learner_profile('00000000-0000-4000-8000-0000000000c1',
    '{"strengths": [], "weaknesses": [{"kind": "error", "error": "forgot-carry"}]}',
    'Élève de CM1.', '2026-10-20 03:00+00')
  and not public.save_learner_profile('00000000-0000-4000-8000-0000000000c3', '{}', '', '2026-10-20 03:00+00'),
  'The server stores a profile, never without consent'
);
select is(
  (select array_agg(id) from public.profiles_due(10, '2026-10-20 04:00+00') id),
  array['00000000-0000-4000-8000-0000000000c2']::uuid[],
  'A profile just computed is not due again'
);
select is(private.request_profile_refresh(), null, 'Without the Vault secrets, the night job does nothing');

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1', true);
select is(
  (select summary from public.learner_profiles where child_id = '00000000-0000-4000-8000-0000000000c1'),
  'Élève de CM1.',
  'The child''s device reads the profile (for the super-power)'
);

-- Withdrawing consent -----------------------------------------------------------------------------

select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select is(
  public.set_personalization('00000000-0000-4000-8000-0000000000c1', false),
  null,
  'The parent turns personalization off'
);
select ok(
  not exists (select 1 from public.child_interests where child_id = '00000000-0000-4000-8000-0000000000c1')
    and not exists (select 1 from public.learner_profiles where child_id = '00000000-0000-4000-8000-0000000000c1')
    and (select universe_asked_at is null from public.children where id = '00000000-0000-4000-8000-0000000000c1'),
  'Turning it off deletes the interests and the profile'
);
update public.children set personalization_consent_at = null
where id = '00000000-0000-4000-8000-0000000000c2';
select ok(
  not exists (select 1 from public.child_interests where child_id = '00000000-0000-4000-8000-0000000000c2')
    and not exists (select 1 from public.interest_other_answers where child_id = '00000000-0000-4000-8000-0000000000c2'),
  'So does withdrawing consent by editing the child'
);

select * from finish();
rollback;
