-- Phase 9: the parent's « Progrès » page (docs/specs.md, Statistiques et récaps), computed here.
--
-- child_progress gives the page everything at once: the month's calendar (done, started, missed,
-- day off or holidays, from the routine), time, success and XP over a week, a month or a quarter,
-- mastery of the grade's programme by domain, the skills mastered, in progress and to consolidate,
-- the three skills with the most mistakes this month (each with a real mistake, rebuilt by the
-- app's engine from its generator, difficulty and seed), and where the child stands against the
-- programme of their grade at this time of the school year. A verdict (good, watch, alert) sums
-- it up for the sentence at the top. The recaps (*_recaps.sql) reuse these functions, and
-- child_highlights gives the child's positive card, without any missed day.
--
-- Mastery fades without practice: private.mastery_at applies the engine's rule (masteryOf and
-- masteryStatus in packages/exercise-engine/src/adaptive/mastery.ts; mastery.test.ts and
-- statistics.test.sql share the same case) at any date. Every stored record is also kept in
-- mastery_history, so that a past month's mastery can be read again.

-- Rules ------------------------------------------------------------------------------------------

-- Skills that have exercises (packages/exercise-engine/src/generators): the only ones a child can
-- master, hence the programme the page measures. practicable.test.ts compares the two lists.
create function private.skills_with_exercises() returns text[]
language sql immutable
set search_path = ''
as $$
  select array['5e.fractions-addition', '5e.puissances-de-10', '5e.relatifs-addition-soustraction',
    '5e.tester-egalite', '6e.angles-degres', '6e.fraction-d-une-quantite', '6e.nombres-premiers',
    '6e.priorites-operatoires', '6e.probabilites', '6e.proportionnalite', 'ce2.addition-posee',
    'ce2.comparer-ranger-nombres', 'ce2.doubles-moities', 'ce2.fractions-unitaires',
    'ce2.longueurs-conversions', 'ce2.multiplication-posee', 'ce2.tables-multiplication',
    'cm1.comparer-decimaux', 'cm1.division-euclidienne', 'cm1.fractions-droite-graduee',
    'cm1.nombres-decimaux', 'cm1.perimetre', 'cm1.proportionnalite',
    'cm2.addition-soustraction-decimaux', 'cm2.aire-rectangle', 'cm2.expressions-inconnue',
    'cm2.fractions-addition-meme-denominateur', 'cm2.fractions-decimaux-equivalences',
    'cm2.multiples-diviseurs', 'cm2.pourcentages']::text[];
$$;

-- As masteryOf: the rating fades by 4 points a day after two days without practice (200 at most);
-- a rating of 800 is 0, 1440 is 80.
create function private.mastery_at(p_elo real, p_practiced_at timestamptz, p_at timestamptz)
returns smallint
language sql immutable
set search_path = ''
as $$
  select least(100, greatest(0, round(((
    p_elo - case when p_practiced_at is null then 0
      else least(200, greatest(0, extract(epoch from (p_at - p_practiced_at)) / 86400 - 2) * 4)
    end - 800) / 8)::numeric)))::smallint;
$$;

-- As masteryStatus: mastered once (masteredAt) stays mastered while it holds 80, then is to review.
create function private.mastery_status_at(
  p_elo real,
  p_attempts integer,
  p_mastered_at timestamptz,
  p_practiced_at timestamptz,
  p_at timestamptz
)
returns public.mastery_status
language sql immutable
set search_path = ''
as $$
  select case
    when p_attempts = 0 and p_mastered_at is null then 'to_discover'
    when p_mastered_at is not null then
      case when private.mastery_at(p_elo, p_practiced_at, p_at) >= 80 then 'mastered' else 'to_review' end
    else 'in_progress'
  end::public.mastery_status;
$$;

-- Share of the school year gone by on a day, from 1 September to 30 June (1 in July and August).
create function private.school_year_progress(p_date date) returns numeric
language sql immutable
set search_path = ''
as $$
  with year as (
    select make_date(
      extract(year from p_date)::integer - case when extract(month from p_date) < 9 then 1 else 0 end,
      9, 1) as start
  )
  select least(1, greatest(0,
    (p_date - year.start)::numeric
      / (make_date(extract(year from year.start)::integer + 1, 6, 30) - year.start)))
  from year;
$$;

-- Mastery history -----------------------------------------------------------------------------------

-- Every value a mastery record took, from the device's syncs: the month's evolution reads it.
create table public.mastery_history (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  skill_code text not null references public.skills (code),
  elo real not null,
  attempts_count integer not null,
  mastered_at timestamptz,
  last_practiced_at timestamptz,
  -- When the record took these values: its last answer (or when it was mastered), never later than
  -- when it was stored.
  recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index mastery_history_child_skill_idx
  on public.mastery_history (child_id, skill_code, recorded_at desc);

create trigger mastery_history_updated_at before update on public.mastery_history
  for each row execute function private.set_updated_at();

alter table public.mastery_history enable row level security;

create policy "Parents read their children's mastery history" on public.mastery_history
  for select to authenticated
  using (child_id in (select private.parent_child_ids()));

-- Written by the trigger below only; no insert, update or delete policy exists.

create function private.record_mastery_history() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (old.elo, old.attempts_count, old.mastered_at, old.last_practiced_at)
    is not distinct from (new.elo, new.attempts_count, new.mastered_at, new.last_practiced_at) then
    return null;
  end if;
  insert into public.mastery_history (
    child_id, skill_code, elo, attempts_count, mastered_at, last_practiced_at, recorded_at
  )
  values (
    new.child_id, new.skill_code, new.elo, new.attempts_count, new.mastered_at,
    new.last_practiced_at,
    least(now(), coalesce(greatest(new.last_practiced_at, new.mastered_at), now()))
  );
  return null;
end;
$$;

create trigger child_skill_mastery_history after insert or update on public.child_skill_mastery
  for each row execute function private.record_mastery_history();

insert into public.mastery_history (
  child_id, skill_code, elo, attempts_count, mastered_at, last_practiced_at, recorded_at
)
select m.child_id, m.skill_code, m.elo, m.attempts_count, m.mastered_at, m.last_practiced_at,
  least(now(), coalesce(greatest(m.last_practiced_at, m.mastered_at), m.updated_at))
from public.child_skill_mastery m;

-- The child's records as they stood at p_at (a skill mastered later is not mastered yet).
create function private.mastery_records_at(p_child_id uuid, p_at timestamptz)
returns table (
  skill_code text,
  elo real,
  attempts_count integer,
  mastered_at timestamptz,
  last_practiced_at timestamptz
)
language sql stable security definer
set search_path = ''
as $$
  select distinct on (h.skill_code)
    h.skill_code, h.elo, h.attempts_count,
    case when h.mastered_at <= p_at then h.mastered_at end,
    h.last_practiced_at
  from public.mastery_history h
  where h.child_id = p_child_id and h.recorded_at <= p_at
  order by h.skill_code, h.recorded_at desc, h.created_at desc;
$$;

-- Each skill of the child's grade that has exercises, and every other skill worked on, at p_at:
-- its mastery, status and list on the page. To consolidate: to review, in progress below 50 after
-- 6 answers, or an earlier grade's skill in progress below 70 (a gap the test or practice found).
create function private.skill_states(p_child_id uuid, p_at timestamptz)
returns table (
  skill_code text,
  title text,
  grade public.grade,
  domain public.skill_domain,
  own_grade boolean,
  earlier_grade boolean,
  practicable boolean,
  mastery smallint,
  status public.mastery_status,
  attempts integer,
  mastered_at timestamptz,
  list text
)
language sql stable security definer
set search_path = ''
as $$
  with child as (
    select c.id, c.grade from public.children c where c.id = p_child_id
  ),
  states as (
    select s.code, s.title, s.grade, s.domain, s.grade = child.grade as own_grade,
      s.grade < child.grade as earlier_grade,
      s.code = any (private.skills_with_exercises()) as practicable,
      case when r.skill_code is null then 0
        else private.mastery_at(r.elo, r.last_practiced_at, p_at) end as mastery,
      case when r.skill_code is null then 'to_discover'::public.mastery_status
        else private.mastery_status_at(
          r.elo, r.attempts_count, r.mastered_at, r.last_practiced_at, p_at) end as status,
      coalesce(r.attempts_count, 0) as attempts,
      r.mastered_at
    from public.skills s
    cross join child
    left join private.mastery_records_at(p_child_id, p_at) r on r.skill_code = s.code
    where (s.grade = child.grade and s.code = any (private.skills_with_exercises()))
      or (r.skill_code is not null and (r.attempts_count > 0 or r.mastered_at is not null))
  )
  select st.code, st.title, st.grade, st.domain, st.own_grade, st.earlier_grade, st.practicable,
    -- Not worked on yet: nothing mastered, whatever the starting guess.
    (case when st.status = 'to_discover' then 0 else st.mastery end)::smallint,
    st.status, st.attempts, st.mastered_at,
    case st.status
      when 'mastered' then 'mastered'
      when 'to_review' then 'to_consolidate'
      when 'in_progress' then
        case when (st.mastery < 50 and st.attempts >= 6) or (st.earlier_grade and st.mastery < 70)
          then 'to_consolidate' else 'in_progress' end
    end
  from states st;
$$;

-- Mastery of the grade's programme by domain at p_at: the average mastery of its skills that have
-- exercises, those not worked on yet counting 0. Domains without exercises are left out.
create function private.domain_mastery(p_child_id uuid, p_at timestamptz) returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'domain', d.domain, 'value', d.value, 'mastered', d.mastered, 'total', d.total)
    order by d.domain), '[]'::jsonb)
  from (
    select st.domain, round(avg(st.mastery))::integer as value,
      (count(*) filter (where st.status = 'mastered'))::integer as mastered,
      count(*)::integer as total
    from private.skill_states(p_child_id, p_at) st
    where st.own_grade and st.practicable
    group by st.domain
  ) d;
$$;

-- Days ---------------------------------------------------------------------------------------------

-- Each day from p_from to p_to, in the child's calendar: what the routine plans (planned, off,
-- vacation, or none without a routine or before it was set), whether the deadline has passed, the
-- day's status, active time, answers and XP. A finished session (not a placement test) makes the
-- day done, even late or on a day off; a session left unfinished makes it started; a planned day
-- past its deadline with nothing played is missed. Rules of childDay (apps/mobile/src/data/
-- session-report.ts), except that a session left unfinished shows as started on any past day.
create function private.child_days(p_child_id uuid, p_from date, p_to date, p_now timestamptz)
returns table (
  local_date date,
  plan text,
  due boolean,
  status text,
  seconds integer,
  answered integer,
  correct integer,
  xp integer
)
language sql stable security definer
set search_path = ''
as $$
  with child as (
    select c.id, (p_now at time zone f.timezone) as local_now,
      (select (r.created_at at time zone f.timezone)::date
       from public.routines r where r.child_id = c.id) as routine_from
    from public.children c
    join public.families f on f.id = c.family_id
    where c.id = p_child_id
  ),
  plans as (
    select d.day::date as local_date, child.local_now, p.deadline_time,
      case
        when child.routine_from is null or d.day::date < child.routine_from then 'none'
        when exists (
          select 1 from public.vacations v
          where v.child_id = child.id and d.day::date between v.from_date and v.to_date
        ) then 'vacation'
        when p.deadline_time is not null then 'planned'
        else 'off'
      end as plan
    from generate_series(p_from, p_to, interval '1 day') as d (day)
    cross join child
    left join lateral private.day_plan(child.id, d.day::date) p on true
  ),
  played as (
    select s.local_date,
      bool_or(s.kind <> 'placement' and s.completed_at is not null) as done,
      bool_or(s.kind <> 'placement') as started,
      sum(s.duration_s)::integer as seconds,
      coalesce(sum(s.xp_awarded), 0)::integer as xp
    from public.sessions s
    where s.child_id = p_child_id and s.local_date between p_from and p_to
    group by s.local_date
  ),
  answers as (
    select s.local_date, count(*)::integer as answered,
      (count(*) filter (where coalesce(a.verified, a.is_correct)))::integer as correct
    from public.attempts a
    join public.sessions s on s.id = a.session_id
    where s.child_id = p_child_id and s.kind <> 'placement'
      and s.local_date between p_from and p_to
    group by s.local_date
  ),
  days as (
    select pl.*, coalesce(pd.done, false) as done, coalesce(pd.started, false) as started,
      pl.plan = 'planned' and (pl.local_date < pl.local_now::date
        or (pl.local_date = pl.local_now::date and pl.local_now::time >= pl.deadline_time)) as due,
      coalesce(pd.seconds, 0) as seconds, coalesce(an.answered, 0) as answered,
      coalesce(an.correct, 0) as correct, coalesce(pd.xp, 0) as xp
    from plans pl
    left join played pd on pd.local_date = pl.local_date
    left join answers an on an.local_date = pl.local_date
  )
  select d.local_date, d.plan, d.due,
    case
      when d.done then 'done'
      when d.started then 'started'
      when d.due then 'missed'
      when d.plan in ('off', 'vacation') then d.plan
      when d.plan = 'planned' then 'pending'
      else 'none'
    end,
    d.seconds, d.answered, d.correct, d.xp
  from days d
  order by d.local_date;
$$;

-- The verdict at the top of the page and of the recaps, from the planned days that are due (or
-- done already) and the answers: « ça va » at 80 % of those days done and 70 % of right answers;
-- alert under 50 % or 60 %, or with nothing done on 3 planned days; watch in between. Success is
-- judged from 10 answers. Nothing planned nor played: no verdict. The recaps' texts
-- (services/recaps) and the app's (strings.progress.verdict) word it.
create function private.recap_verdict(
  p_planned integer,
  p_done integer,
  p_answered integer,
  p_correct integer,
  p_active integer
)
returns jsonb
language sql immutable
set search_path = ''
as $$
  with rates as (
    select
      case when p_planned > 0 then least(1, p_done::numeric / p_planned) end as regularity,
      case when p_answered >= 10 then p_correct::numeric / p_answered end as success
  )
  select jsonb_build_object(
    'level', case
      when p_planned = 0 and p_active = 0 then 'none'
      when rates.regularity < 0.5 or rates.success < 0.6 or (p_planned >= 3 and p_done = 0)
        then 'alert'
      when rates.regularity < 0.8 or rates.success < 0.7 then 'watch'
      else 'good'
    end,
    'regularity', round(rates.regularity, 2),
    'success', round(rates.success, 2),
    'planned', p_planned,
    'done', p_done,
    'active', p_active,
    'answered', p_answered,
    'correct', p_correct,
    'irregular', coalesce(rates.regularity < 0.8, false),
    'struggling', coalesce(rates.success < 0.7, false)
  )
  from rates;
$$;

create function private.days_verdict(p_child_id uuid, p_from date, p_to date, p_now timestamptz)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select private.recap_verdict(
    (count(*) filter (where d.plan = 'planned' and (d.due or d.status = 'done')))::integer,
    (count(*) filter (where d.plan = 'planned' and d.status = 'done'))::integer,
    coalesce(sum(d.answered), 0)::integer,
    coalesce(sum(d.correct), 0)::integer,
    (count(*) filter (where d.status in ('done', 'started')))::integer
  )
  from private.child_days(p_child_id, p_from, p_to, p_now) d;
$$;

-- Skills ---------------------------------------------------------------------------------------------

-- Skills mastered through practice from p_from to p_to (the child's calendar): those the placement
-- test acquired, at the end of a test, are not learnt that month.
create function private.learned_skills(p_child_id uuid, p_from date, p_to date)
returns table (skill_code text, title text, mastered_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select m.skill_code, s.title, m.mastered_at
  from public.child_skill_mastery m
  join public.skills s on s.code = m.skill_code
  join public.children c on c.id = m.child_id
  join public.families f on f.id = c.family_id
  where m.child_id = p_child_id and m.mastered_at is not null
    and (m.mastered_at at time zone f.timezone)::date between p_from and p_to
    and not exists (
      select 1 from public.sessions p
      where p.child_id = p_child_id and p.kind = 'placement'
        and p.completed_at between m.mastered_at - interval '15 minutes'
          and m.mastered_at + interval '15 minutes'
    )
  order by m.mastered_at, m.skill_code;
$$;

-- « Points de blocage »: the skills with the most wrong answers from p_from to p_to (at least 2,
-- placement tests aside), each with its most frequent typical mistake and a real wrong answer to
-- show (one with that mistake if any, the latest): generator, difficulty and seed rebuild it.
create function private.blocking_points(
  p_child_id uuid,
  p_from date,
  p_to date,
  p_limit integer default 3
)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  with answers as (
    select a.skill_code, a.error_type, a.generator_id, a.difficulty, a.seed, a.answer,
      a.answered_at, coalesce(a.verified, a.is_correct) as correct
    from public.attempts a
    join public.sessions s on s.id = a.session_id
    where s.child_id = p_child_id and s.kind <> 'placement'
      and s.local_date between p_from and p_to
  ),
  ranked as (
    select w.skill_code, count(*) filter (where not w.correct) as errors, count(*) as answered,
      (select x.error_type from answers x
       where x.skill_code = w.skill_code and not x.correct and x.error_type is not null
       group by x.error_type order by count(*) desc, x.error_type limit 1) as error_type
    from answers w
    group by w.skill_code
    having count(*) filter (where not w.correct) >= 2
    order by 2 desc, w.skill_code
    limit greatest(p_limit, 0)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'skill', r.skill_code, 'title', k.title, 'grade', k.grade, 'domain', k.domain,
      'errors', r.errors, 'answered', r.answered,
      'error_type', r.error_type, 'error_label', e.label,
      'example', (
        select jsonb_build_object(
          'generator_id', x.generator_id, 'difficulty', x.difficulty, 'seed', x.seed,
          'answer', x.answer, 'error_type', x.error_type, 'error_label', xe.label,
          'answered_at', x.answered_at)
        from answers x
        left join public.error_types xe on xe.code = x.error_type
        where x.skill_code = r.skill_code and not x.correct
        order by (x.error_type is not distinct from r.error_type) desc, x.answered_at desc
        limit 1)
    ) order by r.errors desc, r.skill_code), '[]'::jsonb)
  from ranked r
  join public.skills k on k.code = r.skill_code
  left join public.error_types e on e.code = r.error_type;
$$;

-- Where the child stands against their grade's programme on p_date (an estimate): the year's
-- skills that have exercises are spread from September to June, so that by now the class has met
-- about `expected` of them. Behind: fewer mastered or worked on than that (by more than one), or
-- 3 gaps in earlier grades; ahead: 2 more mastered than expected.
create function private.programme_position(p_child_id uuid, p_date date, p_at timestamptz)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  with child as (
    select c.grade from public.children c where c.id = p_child_id
  ),
  states as (
    select * from private.skill_states(p_child_id, p_at)
  ),
  own as (
    select count(*)::integer as total,
      (count(*) filter (where st.status = 'mastered'))::integer as mastered,
      (count(*) filter (where st.status in ('in_progress', 'to_review')))::integer as working
    from states st where st.own_grade and st.practicable
  ),
  gaps as (
    select st.title from states st
    where st.earlier_grade and st.status = 'in_progress' and st.mastery < 70
    order by st.mastery, st.skill_code
  ),
  counts as (
    select own.*, round(private.school_year_progress(p_date) * own.total)::integer as expected,
      (select count(*)::integer from gaps) as gap_count
    from own
  )
  select jsonb_build_object(
    'grade', child.grade,
    'year_progress', round(private.school_year_progress(p_date), 2),
    'total', counts.total,
    'expected', counts.expected,
    'mastered', counts.mastered,
    'working', counts.working,
    'gaps', counts.gap_count,
    'gap_titles', coalesce((select jsonb_agg(g.title) from (select * from gaps limit 3) g), '[]'::jsonb),
    'position', case
      when counts.total = 0 then null
      when counts.gap_count >= 3 or counts.mastered + counts.working < counts.expected - 1
        then 'behind'
      when counts.mastered >= counts.expected + 2 and counts.mastered >= 2 then 'ahead'
      else 'on_track'
    end
  )
  from child, counts;
$$;

-- The page ---------------------------------------------------------------------------------------

-- The parent's « Progrès » page for a child: p_range sets the curves (week: 7 days, month: 30
-- days, quarter: 13 weeks), p_month the calendar's month (this month by default).
create function public.child_progress(
  p_child_id uuid,
  p_range text default 'month',
  p_month date default null,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  today date;
  month_start date;
  series_from date;
begin
  if p_child_id is null or p_child_id not in (select private.parent_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  if p_range is null or p_range not in ('week', 'month', 'quarter') then
    raise exception 'invalid_range' using errcode = 'PT400';
  end if;

  today := private.child_today(p_child_id, p_now);
  month_start := date_trunc('month', coalesce(p_month, today))::date;
  series_from := case p_range
    when 'week' then today - 6
    when 'month' then today - 29
    else date_trunc('week', today)::date - 84
  end;

  return jsonb_build_object(
    'today', today,
    -- The last two weeks: enough to judge at the start of a month too.
    'verdict', private.days_verdict(p_child_id, today - 13, today, p_now),
    'calendar', jsonb_build_object(
      'month', month_start,
      'days', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'date', d.local_date, 'plan', d.plan, 'status', d.status,
          'minutes', round(d.seconds / 60.0)) order by d.local_date), '[]'::jsonb)
        from private.child_days(
          p_child_id, month_start, (month_start + interval '1 month - 1 day')::date, p_now) d)
    ),
    'series', (
      with days as (
        select * from private.child_days(p_child_id, series_from, today, p_now)
      )
      select jsonb_build_object(
        'range', p_range,
        'from', series_from,
        'to', today,
        'days', coalesce((
          select jsonb_agg(jsonb_build_object(
            'date', d.local_date, 'minutes', round(d.seconds / 60.0), 'answered', d.answered,
            'correct', d.correct, 'xp', d.xp) order by d.local_date)
          from days d), '[]'::jsonb),
        'weeks', coalesce((
          select jsonb_agg(jsonb_build_object(
            'start', w.start, 'minutes', w.minutes, 'answered', w.answered,
            'correct', w.correct, 'xp', w.xp) order by w.start)
          from (
            select date_trunc('week', d.local_date)::date as start,
              round(sum(d.seconds) / 60.0) as minutes, sum(d.answered) as answered,
              sum(d.correct) as correct, sum(d.xp) as xp
            from days d group by 1
          ) w), '[]'::jsonb)
      )
    ),
    'domains', private.domain_mastery(p_child_id, p_now),
    'skills', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'code', st.skill_code, 'title', st.title, 'grade', st.grade, 'domain', st.domain,
        'mastery', st.mastery, 'status', st.status, 'list', st.list)
        order by st.list, st.grade desc, st.mastery desc, st.skill_code), '[]'::jsonb)
      from private.skill_states(p_child_id, p_now) st
      where st.list is not null
    ),
    'blocking', private.blocking_points(
      p_child_id, date_trunc('month', today)::date, today),
    'programme', private.programme_position(p_child_id, today, p_now)
  );
end;
$$;

-- The child's positive card (docs/specs.md, côté enfant): the first week of a month, last month;
-- otherwise Monday to Wednesday, last week. What was done and learnt only, never a missed day;
-- nothing when there is nothing to celebrate.
create function public.child_highlights(p_child_id uuid, p_now timestamptz default now())
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  today date;
  period_kind text;
  period_from date;
  period_to date;
  done_days integer;
  right_answers integer;
  earned_xp integer;
  learned integer;
  badges integer;
begin
  if p_child_id is null or p_child_id not in (select private.accessible_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;

  today := private.child_today(p_child_id, p_now);
  if extract(day from today) <= 7 then
    period_kind := 'month';
    period_from := (date_trunc('month', today) - interval '1 month')::date;
    period_to := (date_trunc('month', today) - interval '1 day')::date;
  elsif extract(isodow from today) <= 3 then
    period_kind := 'week';
    period_from := date_trunc('week', today)::date - 7;
    period_to := date_trunc('week', today)::date - 1;
  else
    return null;
  end if;

  select (count(*) filter (where d.status = 'done'))::integer, coalesce(sum(d.correct), 0)::integer,
    coalesce(sum(d.xp), 0)::integer
  into done_days, right_answers, earned_xp
  from private.child_days(p_child_id, period_from, period_to, p_now) d;

  select count(*)::integer into learned
  from private.learned_skills(p_child_id, period_from, period_to);

  select count(*)::integer into badges
  from public.child_badges b
  join public.children c on c.id = b.child_id
  join public.families f on f.id = c.family_id
  where b.child_id = p_child_id
    and (b.earned_at at time zone f.timezone)::date between period_from and period_to;

  if done_days = 0 and right_answers = 0 and learned = 0 then
    return null;
  end if;

  return jsonb_build_object(
    'kind', period_kind,
    'from', period_from,
    'to', period_to,
    'days', done_days,
    'correct', right_answers,
    'xp', earned_xp,
    'learned', learned,
    'badges', badges
  );
end;
$$;

revoke all on function private.skills_with_exercises() from public;
revoke all on function private.mastery_at(real, timestamptz, timestamptz) from public;
revoke all on function private.mastery_status_at(real, integer, timestamptz, timestamptz, timestamptz)
  from public;
revoke all on function private.school_year_progress(date) from public;
revoke all on function private.record_mastery_history() from public;
revoke all on function private.mastery_records_at(uuid, timestamptz) from public;
revoke all on function private.skill_states(uuid, timestamptz) from public;
revoke all on function private.domain_mastery(uuid, timestamptz) from public;
revoke all on function private.child_days(uuid, date, date, timestamptz) from public;
revoke all on function private.recap_verdict(integer, integer, integer, integer, integer) from public;
revoke all on function private.days_verdict(uuid, date, date, timestamptz) from public;
revoke all on function private.learned_skills(uuid, date, date) from public;
revoke all on function private.blocking_points(uuid, date, date, integer) from public;
revoke all on function private.programme_position(uuid, date, timestamptz) from public;

revoke all on function public.child_progress(uuid, text, date, timestamptz) from public, anon;
grant execute on function public.child_progress(uuid, text, date, timestamptz) to authenticated;
revoke all on function public.child_highlights(uuid, timestamptz) from public, anon;
grant execute on function public.child_highlights(uuid, timestamptz) to authenticated;
