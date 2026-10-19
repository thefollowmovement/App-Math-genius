-- Phase 6f: illustrated companions (docs/design/compagnons.md).
--
-- Eight companions (packages/shared/src/companions.ts) replace the emoji ones of the companion
-- slot. Four are sold in the shop: Lapin Street (80 gems), Draco (120), Licorne de Cristal (150)
-- and Kitsune (250). Four are earned with a badge: Chouette Galactique with the first exercise (a
-- new badge), Baekho with a 7-day streak, Chaton Cosmique with the second island and Phénix at
-- level 10. cosmetics.test.ts and shop.test.ts compare the catalogs below with the app's.
--
-- What the children had moves over: the fox becomes Kitsune, the unicorn the Licorne de Cristal,
-- the dragon Draco, and the kitten the Chaton Cosmique, which its owners keep without the island
-- badge (child_cosmetics). The puppy, the panda and the octopus are refunded in gems. A hero who
-- wore the pixel robot or the little Glitch, earned with the badge that now unlocks Phénix or the
-- Chaton Cosmique, wears that companion instead.

-- Cosmetics ----------------------------------------------------------------------------------------

-- Every cosmetic, by id: its slot and how it is unlocked.
create or replace function private.cosmetics() returns jsonb
language sql immutable
set search_path = ''
as $$
  select '{"aura-pink": {"slot": "aura", "unlock": {"kind": "free"}}, "aura-cyan": {"slot": "aura", "unlock": {"kind": "badge", "badge": "streak-3"}}, "aura-gold": {"slot": "aura", "unlock": {"kind": "badge", "badge": "streak-7"}}, "aura-green": {"slot": "aura", "unlock": {"kind": "badge", "badge": "combo-10"}}, "aura-rainbow": {"slot": "aura", "unlock": {"kind": "badge", "badge": "streak-30"}}, "frame-neon": {"slot": "frame", "unlock": {"kind": "free"}}, "frame-stars": {"slot": "frame", "unlock": {"kind": "badge", "badge": "perfect-1"}}, "frame-crown": {"slot": "frame", "unlock": {"kind": "badge", "badge": "island-1"}}, "frame-lightning": {"slot": "frame", "unlock": {"kind": "badge", "badge": "combo-25"}}, "frame-gold": {"slot": "frame", "unlock": {"kind": "badge", "badge": "boss-perfect"}}, "hibou": {"slot": "companion", "unlock": {"kind": "badge", "badge": "first-exercise"}}, "lapin": {"slot": "companion", "unlock": {"kind": "shop", "item": "lapin"}}, "dragon": {"slot": "companion", "unlock": {"kind": "shop", "item": "dragon"}}, "licorne": {"slot": "companion", "unlock": {"kind": "shop", "item": "licorne"}}, "tigre": {"slot": "companion", "unlock": {"kind": "badge", "badge": "streak-7"}}, "renard": {"slot": "companion", "unlock": {"kind": "shop", "item": "renard"}}, "chat": {"slot": "companion", "unlock": {"kind": "badge", "badge": "island-2"}}, "phenix": {"slot": "companion", "unlock": {"kind": "badge", "badge": "level-10"}}, "bow": {"slot": "accessory", "unlock": {"kind": "shop", "item": "bow"}}, "cap": {"slot": "accessory", "unlock": {"kind": "shop", "item": "cap"}}, "sunglasses": {"slot": "accessory", "unlock": {"kind": "shop", "item": "sunglasses"}}, "top-hat": {"slot": "accessory", "unlock": {"kind": "shop", "item": "top-hat"}}, "crown": {"slot": "accessory", "unlock": {"kind": "shop", "item": "crown"}}, "golden-mic": {"slot": "accessory", "unlock": {"kind": "badge", "badge": "sessions-25"}}}'::jsonb;
$$;

-- Cosmetics a child has without their unlock condition: the Chaton Cosmique of a child who had
-- bought the kitten. Written by migrations only; the family reads them, like the items bought.
create table public.child_cosmetics (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  cosmetic_id text not null check (private.cosmetics() ? cosmetic_id),
  granted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, cosmetic_id)
);

create trigger child_cosmetics_updated_at before update on public.child_cosmetics
  for each row execute function private.set_updated_at();

alter table public.child_cosmetics enable row level security;

create policy "Parents and devices read their children's cosmetics" on public.child_cosmetics
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

-- No insert, update or delete policy exists.

-- The first cosmetic of an avatar the child has not unlocked: a badge not earned, an item not
-- bought, and not kept either. Null when everything is.
create or replace function private.locked_cosmetic(p_child_id uuid, p_avatar jsonb) returns text
language sql stable
set search_path = ''
as $$
  select worn.value
  from jsonb_each_text(p_avatar -> 'wear') worn
  cross join lateral (select private.cosmetics() -> worn.value -> 'unlock' as unlock) item
  where not exists (
      select 1 from public.child_cosmetics k
      where k.child_id = p_child_id and k.cosmetic_id = worn.value
    )
    and case item.unlock ->> 'kind'
      when 'badge' then not exists (
        select 1 from public.child_badges b
        where b.child_id = p_child_id and b.badge_code = item.unlock ->> 'badge'
      )
      when 'shop' then not exists (
        select 1 from public.child_items i
        where i.child_id = p_child_id and i.item_code = item.unlock ->> 'item'
      )
      else false
    end
  order by worn.key
  limit 1;
$$;

-- The shop ------------------------------------------------------------------------------------------

-- The whole catalog, in the shop's order (shop.test.ts reads the last one the migrations write).
-- Positions are unique: they move out of the way first.
update public.shop_items set position = position + 100;

insert into public.shop_items (code, kind, price_gems, position) values
  ('lapin', 'companion', 80, 1),
  ('dragon', 'companion', 120, 2),
  ('licorne', 'companion', 150, 3),
  ('renard', 'companion', 250, 4),
  ('bow', 'accessory', 30, 5),
  ('cap', 'accessory', 30, 6),
  ('sunglasses', 'accessory', 40, 7),
  ('top-hat', 'accessory', 60, 8),
  ('crown', 'accessory', 120, 9),
  ('confetti', 'effect', 50, 10),
  ('sparkles', 'effect', 50, 11),
  ('rainbow', 'effect', 80, 12),
  ('fireworks', 'effect', 120, 13)
on conflict (code) do update
  set kind = excluded.kind, price_gems = excluded.price_gems, position = excluded.position;

-- The fox and the unicorn take their new names; the dragon keeps its own.
update public.child_items set item_code = 'renard' where item_code = 'fox';
update public.child_items set item_code = 'licorne' where item_code = 'unicorn';

-- The kitten stays, as the Chaton Cosmique.
insert into public.child_cosmetics (child_id, cosmetic_id, granted_at)
select i.child_id, 'chat', i.bought_at
from public.child_items i
where i.item_code = 'kitten'
on conflict (child_id, cosmetic_id) do nothing;

-- The puppy, the panda and the octopus: the gems paid come back (each purchase once).
insert into public.gem_transactions (child_id, amount, reason, ref_id, local_date)
select i.child_id, -g.amount, 'refund', i.id, private.child_today(i.child_id, now())
from public.child_items i
join public.gem_transactions g on g.reason = 'shop' and g.ref_id = i.id
where i.item_code in ('puppy', 'panda', 'octopus') and g.amount < 0;

delete from public.child_items where item_code in ('kitten', 'puppy', 'panda', 'octopus');
delete from public.shop_items
where code in ('kitten', 'puppy', 'fox', 'panda', 'octopus', 'unicorn');

-- Gem balances, with the refunds.
select private.refresh_progress(refunded.child_id, private.child_today(refunded.child_id, now()))
from (select distinct g.child_id from public.gem_transactions g where g.reason = 'refund') refunded;

-- Avatars -------------------------------------------------------------------------------------------

-- The hero's old companion becomes its new one, or leaves (refunded).
update public.children c
set avatar = case
    when moved.companion is null then c.avatar #- '{wear,companion}'
    else jsonb_set(c.avatar, '{wear,companion}', to_jsonb(moved.companion))
  end
from (
  select id, case avatar #>> '{wear,companion}'
      when 'fox' then 'renard'
      when 'unicorn' then 'licorne'
      when 'kitten' then 'chat'
      when 'glitch-cube' then 'chat'
      when 'pixel-robot' then 'phenix'
    end as companion
  from public.children
  where avatar #>> '{wear,companion}' in (
    'kitten', 'puppy', 'fox', 'panda', 'octopus', 'unicorn', 'pixel-robot', 'glitch-cube'
  )
) moved
where moved.id = c.id;

-- Badges --------------------------------------------------------------------------------------------

-- The first exercise answered unlocks the Chouette Galactique.
insert into public.badges (code, category, metric, threshold, position) values
  ('first-exercise', 'discovery', 'exercises_done', 1, 44);

-- Badge measures: those of the challenges migration, plus the exercises answered; refunds give
-- back gems spent, they are not earned.
alter function private.badge_metrics(uuid) rename to challenge_badge_metrics;

create function private.badge_metrics(p_child_id uuid) returns jsonb
language sql stable
set search_path = ''
as $$
  select private.challenge_badge_metrics(p_child_id) || jsonb_build_object(
    'exercises_done', (select count(*) from public.attempts a
      join public.sessions s on s.id = a.session_id
      where s.child_id = p_child_id and s.awarded_at is not null),
    'gems_earned', (select coalesce(sum(g.amount), 0) from public.gem_transactions g
      where g.child_id = p_child_id and g.amount > 0 and g.reason <> 'refund')
  );
$$;

-- Children who already played have it now (granted by no session, like the first badges).
insert into public.child_badges (child_id, badge_code, session_id, earned_at)
select distinct s.child_id, 'first-exercise', null::uuid, now()
from public.sessions s
join public.attempts a on a.session_id = s.id
where s.awarded_at is not null
on conflict (child_id, badge_code) do nothing;

revoke all on function private.badge_metrics(uuid) from public;
