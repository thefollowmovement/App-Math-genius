-- Phase 5: rewards from the parent. The parent sets a real-life reward unlocked by a goal (a
-- streak, an amount of XP or islands completed); the child sees how far they are; the server
-- unlocks it once the goal is reached (at the next award, or right away if it already is); the
-- parent then marks it given. Goals mirror packages/shared/src/parent-rewards.ts.

create type public.parent_reward_goal as enum ('streak', 'xp', 'islands');

create table public.parent_rewards (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60 and title = btrim(title)),
  goal public.parent_reward_goal not null,
  target integer not null check (target between 1 and 100000),
  -- Set by the server only (no update policy).
  unlocked_at timestamptz,
  given_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (given_at is null or unlocked_at is not null)
);
create index parent_rewards_child_id_idx on public.parent_rewards (child_id);

create trigger parent_rewards_updated_at before update on public.parent_rewards
  for each row execute function private.set_updated_at();

alter table public.parent_rewards enable row level security;

create policy "Parents and devices read their children's rewards" on public.parent_rewards
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

create policy "Parents create rewards for their children" on public.parent_rewards
  for insert to authenticated
  with check (
    child_id in (select private.parent_child_ids()) and unlocked_at is null and given_at is null
  );

create policy "Parents remove their children's rewards" on public.parent_rewards
  for delete to authenticated
  using (child_id in (select private.parent_child_ids()));

-- Unlocking is the server's, giving goes through give_parent_reward: no update policy exists.

-- Where the child stands on a goal.
create function private.reward_goal_value(p_child_id uuid, p_goal public.parent_reward_goal)
returns integer
language sql stable
set search_path = ''
as $$
  select case p_goal
    when 'streak' then
      coalesce((select p.streak_current from public.progress p where p.child_id = p_child_id), 0)
    when 'xp' then
      coalesce((select p.xp from public.progress p where p.child_id = p_child_id), 0)
    else (select count(*) from public.island_completions i where i.child_id = p_child_id)
  end::integer;
$$;

-- Unlocks the child's rewards whose goal is reached; returns them ([{id, title}]).
create function private.unlock_parent_rewards(p_child_id uuid, p_now timestamptz)
returns jsonb
language sql
set search_path = ''
as $$
  with unlocked as (
    update public.parent_rewards r
    set unlocked_at = p_now
    where r.child_id = p_child_id and r.unlocked_at is null
      and private.reward_goal_value(p_child_id, r.goal) >= r.target
    returning r.id, r.title, r.created_at
  )
  select coalesce(
    jsonb_agg(jsonb_build_object('id', u.id, 'title', u.title) order by u.created_at), '[]'
  )
  from unlocked u;
$$;

-- A reward whose goal is already reached is unlocked as soon as it is created.
create function private.unlock_new_parent_reward() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  perform private.unlock_parent_rewards(new.child_id, now());
  return null;
end;
$$;

create trigger parent_rewards_unlock_on_create after insert on public.parent_rewards
  for each row execute function private.unlock_new_parent_reward();

-- The parent hands an unlocked reward over.
create function public.give_parent_reward(p_reward_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  reward public.parent_rewards;
begin
  select * into reward from public.parent_rewards r
  where r.id = p_reward_id and r.child_id in (select private.parent_child_ids())
  for update;
  if reward.id is null then
    raise exception 'reward_not_found' using errcode = 'PT404';
  end if;
  if reward.unlocked_at is null then
    raise exception 'reward_locked' using errcode = 'PT409';
  end if;
  update public.parent_rewards r set given_at = coalesce(r.given_at, now()) where r.id = reward.id;
end;
$$;

-- The challenge, the boss, the parent's rewards (which may count both), then the badges.
create or replace function private.award_extras(p_session public.sessions, p_now timestamptz)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  challenge jsonb := private.settle_challenge(p_session, p_now);
  boss jsonb;
  unlocked jsonb;
begin
  if p_session.kind = 'boss' then
    boss := private.settle_boss(p_session, p_now);
  end if;
  unlocked := private.unlock_parent_rewards(p_session.child_id, p_now);
  -- Only what happened is told.
  return jsonb_build_object(
    'badges', to_jsonb(private.grant_badges(p_session.child_id, p_session.id, p_now))
  )
    || case when boss is null then '{}'::jsonb else jsonb_build_object('boss', boss) end
    || case when challenge is null then '{}'::jsonb
      else jsonb_build_object('challenge', challenge) end
    || case when unlocked = '[]'::jsonb then '{}'::jsonb
      else jsonb_build_object('parent_rewards', unlocked) end;
end;
$$;

revoke all on function private.reward_goal_value(uuid, public.parent_reward_goal) from public;
revoke all on function private.unlock_parent_rewards(uuid, timestamptz) from public;
revoke all on function private.unlock_new_parent_reward() from public;
revoke all on function public.give_parent_reward(uuid) from public, anon;
grant execute on function public.give_parent_reward(uuid) to authenticated;
