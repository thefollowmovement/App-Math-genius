-- World map bosses (phase 5): a boss session completes its island when the server's grading
-- finds 80 % of right answers. Run with `pnpm supabase:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

-- Alice's family (Léa), Bob's family (Tom).
insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.com',
   '{"display_name": "Alice", "privacy_consent_version": "2026-10"}', false),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'bob@example.com',
   '{"display_name": "Bob", "privacy_consent_version": "2026-10"}', false);

insert into public.children (id, family_id, display_name, gender, grade)
select child.id, p.family_id, child.name, 'girl', 'CE2'
from (values
  ('00000000-0000-4000-8000-0000000000c1'::uuid, 'Léa', 'alice@example.com'),
  ('00000000-0000-4000-8000-0000000000c2'::uuid, 'Tom', 'bob@example.com')
) as child (id, name, email)
join auth.users u on u.email = child.email
join public.parents p on p.user_id = u.id;

create function pg_temp.as_user(id text) returns void
language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', id, 'role', 'authenticated', 'is_anonymous', false)::text, true);
$$;

-- A finished session on `day`, one exercise per skill given, all right according to the device.
create function pg_temp.play(child uuid, day date, skill_codes text[], kind text default 'boss')
returns uuid language plpgsql as $$
declare
  id uuid := gen_random_uuid();
  total int := cardinality(skill_codes);
begin
  insert into public.sessions (
    id, child_id, kind, local_date, started_at, completed_at, goal_type, goal_value, answered,
    score, duration_s, goal_met
  )
  values (
    id, child, kind::public.session_kind, day, day + time '17:00', day + time '17:10',
    'count', total, total, total, 600, true
  );
  insert into public.attempts (
    session_id, child_id, position, skill_code, generator_id, difficulty, seed, slot, answer,
    is_correct, time_ms, answered_at, learner_elo
  )
  select id, child, i - 1, skill_codes[i], skill_codes[i], 2, i, 'current',
    '{"type": "numeric", "text": "0"}', true, 5000, day + time '17:00' + i * interval '1 minute',
    1000
  from generate_subscripts(skill_codes, 1) as i;
  return id;
end;
$$;

-- Awards a session with the first `right_answers` right; returns the award.
create function pg_temp.award(session uuid, right_answers int, day date) returns jsonb
language sql as $$
  select public.award_session(
    session,
    (select jsonb_agg(jsonb_build_object('position', a.position, 'correct', a.position < right_answers))
     from public.attempts a where a.session_id = session),
    (day + time '18:00') at time zone 'Europe/Paris'
  );
$$;

create temp table numbers (codes text[]);
insert into numbers values (array[
  'ce2.tables-multiplication', 'ce2.doubles-moities', 'ce2.addition-posee',
  'ce2.comparer-ranger-nombres', 'ce2.fractions-unitaires', 'ce2.multiplication-posee',
  'ce2.tables-multiplication', 'ce2.doubles-moities', 'ce2.addition-posee',
  'ce2.comparer-ranger-nombres']);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.island_completions'::regclass),
  'RLS is enabled on island completions'
);

create temp table lost as select pg_temp.award(
  pg_temp.play('00000000-0000-4000-8000-0000000000c1', '2026-10-12', (select codes from numbers)),
  7, '2026-10-12') as award;
select is(
  (select award -> 'boss' from lost),
  '{"grade": "CE2", "domain": "numbers", "passed": false, "first": false}',
  '7 right answers out of 10: the boss of the numbers island resists'
);

create temp table won as select pg_temp.award(
  pg_temp.play('00000000-0000-4000-8000-0000000000c1', '2026-10-13', (select codes from numbers)),
  8, '2026-10-13') as award;
select is(
  (select award -> 'boss' from won),
  '{"grade": "CE2", "domain": "numbers", "passed": true, "first": true}',
  '8 out of 10: the boss is beaten and the island completed'
);
select is(
  (select award -> 'badges' from won),
  '["island-1"]',
  'and the first island earns its badge'
);
select is(
  (select row(grade, domain)::text from public.island_completions
   where child_id = '00000000-0000-4000-8000-0000000000c1'),
  row('CE2', 'numbers')::text,
  'The completion is kept'
);
select is(
  (select row(award ->> 'gems', award ->> 'chest', award ->> 'streak')::text from won),
  row('0', null, '0')::text,
  'A boss earns XP but no daily gems, no chest and no streak day'
);

select is(
  pg_temp.award(
    pg_temp.play('00000000-0000-4000-8000-0000000000c1', '2026-10-14', (select codes from numbers)),
    10, '2026-10-14') -> 'boss',
  '{"grade": "CE2", "domain": "numbers", "passed": true, "first": false}',
  'Beating the same boss again does not complete the island twice'
);
select is(
  (select count(*)::int from public.island_completions
   where child_id = '00000000-0000-4000-8000-0000000000c1'),
  1,
  'one completion per island'
);
select ok(
  exists (select 1 from public.child_badges
          where child_id = '00000000-0000-4000-8000-0000000000c1' and badge_code = 'boss-perfect'),
  'A boss beaten without an error earns its badge'
);

select is(
  pg_temp.award(
    pg_temp.play('00000000-0000-4000-8000-0000000000c2', '2026-10-13',
      array['ce2.tables-multiplication', 'ce2.longueurs-conversions', 'ce2.doubles-moities',
        'ce2.addition-posee', 'ce2.tables-multiplication', 'ce2.doubles-moities']),
    6, '2026-10-13') -> 'boss',
  null,
  'A boss mixing two islands is not settled'
);
select is(
  pg_temp.award(
    pg_temp.play('00000000-0000-4000-8000-0000000000c2', '2026-10-14',
      array['ce2.longueurs-conversions', 'ce2.longueurs-conversions', 'ce2.longueurs-conversions',
        'ce2.longueurs-conversions', 'ce2.longueurs-conversions']),
    5, '2026-10-14') -> 'boss' ->> 'passed',
  'false',
  'Fewer than 6 exercises cannot beat a boss'
);

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select is(
  (select count(*)::int from public.island_completions),
  1,
  'Alice reads Léa''s completed islands'
);
select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select is(
  (select count(*)::int from public.island_completions),
  0,
  'Bob reads none of them'
);

select * from finish();
rollback;
