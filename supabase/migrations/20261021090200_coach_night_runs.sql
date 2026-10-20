-- Phase 7c: the night's pre-generation in short runs, and the back-office's prompt test.
--
-- An Edge Function stops after 150 seconds, and our own server may take most of a minute per
-- explanation: the night is several runs (every 15 minutes from 1:00 to 4:45 UTC). night_batch is
-- what a whole night writes; each run gets what is left, and leaves out what was tried tonight
-- (a rejected combination is not asked again before the next night).

-- Calls left tonight (UTC day), out of night_batch.
create function private.coach_night_left() returns integer
language sql stable security definer
set search_path = ''
as $$
  select greatest(s.night_batch - (
    select count(*)::integer from public.ai_usage u
    where u.task = 'night' and u.created_at >= date_trunc('day', now())), 0)
  from public.ai_settings s where s.id = 1;
$$;
revoke all on function private.coach_night_left() from public;

create or replace function public.coach_night_plan()
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
    -- Written (pending or approved), or tried tonight.
    'existing', coalesce((
      select jsonb_agg(distinct k.key)
      from (
        select concat_ws('|', e.skill_code, coalesce(e.error_type, ''),
          coalesce(e.universe_id, ''), e.grade_band) as key
        from public.explanations e where e.status <> 'rejected'
        union
        select concat_ws('|', u.skill_code, coalesce(u.error_type, ''),
          coalesce(u.universe_id, ''), u.grade_band)
        from public.ai_usage u
        where u.task = 'night' and u.created_at >= date_trunc('day', now())
          and u.skill_code is not null and u.grade_band is not null
      ) k), '[]'::jsonb),
    'remaining', private.coach_night_left(),
    'settings', (select to_jsonb(s) from public.ai_settings s where s.id = 1),
    'prompt', (
      select jsonb_build_object('version', p.version, 'system', p.system, 'user', p.user_template)
      from public.ai_prompts p
      where p.task = 'explain' and p.active and p.grade_band is null limit 1),
    'banned', coalesce((select jsonb_agg(w.word) from public.ai_banned_words w), '[]'::jsonb),
    'spent', private.ai_spent()
  );
$$;

-- What the gateway needs to try a prompt from the back-office (the caller's role is checked by the
-- function first): settings, banned words, what was spent, and the universe to use.
create function public.coach_preview_context(p_universe_id text)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'settings', (select to_jsonb(s) from public.ai_settings s where s.id = 1),
    'banned', coalesce((select jsonb_agg(w.word) from public.ai_banned_words w), '[]'::jsonb),
    'spent', private.ai_spent(),
    'universe', (
      select jsonb_build_object('id', u.id, 'name', u.name, 'vocabulary', u.vocabulary)
      from public.universes u where u.id = p_universe_id)
  );
$$;
revoke all on function public.coach_preview_context(text) from public, anon, authenticated;
grant execute on function public.coach_preview_context(text) to service_role;

-- Nothing is posted once the night's batch is written.
create or replace function private.request_coach_night() returns bigint
language plpgsql security definer
set search_path = ''
as $$
declare
  url text;
  service_key text;
begin
  if not exists (select 1 from public.ai_settings where enabled)
    or coalesce(private.coach_night_left(), 0) = 0 then
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
    timeout_milliseconds := 150000
  );
end;
$$;

select cron.unschedule('coach-night');
select cron.schedule('coach-night', '*/15 1-4 * * *', 'select private.request_coach_night()');
