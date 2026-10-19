-- Phase 6d: the Neon Stage theme, heroes and cosmetics.
--
-- The child no longer builds an avatar from parts: they pick one of six heroes
-- (packages/shared/src/heroes.ts) and dress it with cosmetics (packages/shared/src/cosmetics.ts:
-- one slot each, unlocked for free, with a badge or in the shop). heroes.test.ts and
-- cosmetics.test.ts compare those catalogs with the literals below. children.avatar becomes
-- {"hero": ..., "wear": {slot: cosmetic}}, or {} until the child chooses (the app then shows the
-- default look of the profile, private.default_avatar).
--
-- What the hero wears lives in one place, children.avatar.wear, whether the item came from the
-- shop or from a badge. The shop keeps its rules (prices, gems, one item of a kind worn): buying
-- or wearing a companion or an accessory now writes there. Victory effects, which are not worn by
-- the hero, keep child_items.equipped.

-- Themes ------------------------------------------------------------------------------------------

-- Neon Stage joins the themes, and becomes the default one.
create or replace function private.theme_ids() returns text[]
language sql immutable
set search_path = ''
as $$
  select array['neon', 'kawaii', 'manga', 'space'];
$$;

alter table public.children alter column theme_id set default 'neon';

-- Heroes and cosmetics -------------------------------------------------------------------------------

create function private.hero_ids() returns text[]
language sql immutable
set search_path = ''
as $$
  select array['nova', 'juno', 'mika', 'kai', 'taro', 'leo'];
$$;

-- Every cosmetic, by id: its slot and how it is unlocked.
create function private.cosmetics() returns jsonb
language sql immutable
set search_path = ''
as $$
  select '{"aura-pink": {"slot": "aura", "unlock": {"kind": "free"}}, "aura-cyan": {"slot": "aura", "unlock": {"kind": "badge", "badge": "streak-3"}}, "aura-gold": {"slot": "aura", "unlock": {"kind": "badge", "badge": "streak-7"}}, "aura-green": {"slot": "aura", "unlock": {"kind": "badge", "badge": "combo-10"}}, "aura-rainbow": {"slot": "aura", "unlock": {"kind": "badge", "badge": "streak-30"}}, "frame-neon": {"slot": "frame", "unlock": {"kind": "free"}}, "frame-stars": {"slot": "frame", "unlock": {"kind": "badge", "badge": "perfect-1"}}, "frame-crown": {"slot": "frame", "unlock": {"kind": "badge", "badge": "island-1"}}, "frame-lightning": {"slot": "frame", "unlock": {"kind": "badge", "badge": "combo-25"}}, "frame-gold": {"slot": "frame", "unlock": {"kind": "badge", "badge": "boss-perfect"}}, "kitten": {"slot": "companion", "unlock": {"kind": "shop", "item": "kitten"}}, "puppy": {"slot": "companion", "unlock": {"kind": "shop", "item": "puppy"}}, "fox": {"slot": "companion", "unlock": {"kind": "shop", "item": "fox"}}, "panda": {"slot": "companion", "unlock": {"kind": "shop", "item": "panda"}}, "octopus": {"slot": "companion", "unlock": {"kind": "shop", "item": "octopus"}}, "unicorn": {"slot": "companion", "unlock": {"kind": "shop", "item": "unicorn"}}, "dragon": {"slot": "companion", "unlock": {"kind": "shop", "item": "dragon"}}, "pixel-robot": {"slot": "companion", "unlock": {"kind": "badge", "badge": "level-10"}}, "glitch-cube": {"slot": "companion", "unlock": {"kind": "badge", "badge": "island-2"}}, "bow": {"slot": "accessory", "unlock": {"kind": "shop", "item": "bow"}}, "cap": {"slot": "accessory", "unlock": {"kind": "shop", "item": "cap"}}, "sunglasses": {"slot": "accessory", "unlock": {"kind": "shop", "item": "sunglasses"}}, "top-hat": {"slot": "accessory", "unlock": {"kind": "shop", "item": "top-hat"}}, "crown": {"slot": "accessory", "unlock": {"kind": "shop", "item": "crown"}}, "golden-mic": {"slot": "accessory", "unlock": {"kind": "badge", "badge": "sessions-25"}}}'::jsonb;
$$;

-- The look of a child who has not chosen yet (DEFAULT_LOOKS in packages/shared/src/avatar.ts).
create function private.default_avatar(p_gender text) returns jsonb
language sql immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'hero', case p_gender when 'girl' then 'nova' else 'kai' end,
    'wear', '{"frame": "frame-neon"}'::jsonb
  );
$$;

-- Avatars -------------------------------------------------------------------------------------------

-- The old avatars (parts drawn by the app) become heroes, wearing what the shop had them wear.
alter table public.children drop constraint children_avatar_check;

update public.children c
set avatar = jsonb_set(
  private.default_avatar(c.gender::text),
  '{wear}',
  (private.default_avatar(c.gender::text) -> 'wear') || coalesce((
    select jsonb_object_agg(s.kind::text, i.item_code)
    from public.child_items i
    join public.shop_items s on s.code = i.item_code
    where i.child_id = c.id and i.equipped and s.kind in ('companion', 'accessory')
  ), '{}'::jsonb)
)
where c.avatar <> '{}'::jsonb
  or exists (
    select 1 from public.child_items i
    join public.shop_items s on s.code = i.item_code
    where i.child_id = c.id and i.equipped and s.kind in ('companion', 'accessory')
  );

update public.child_items i set equipped = false
from public.shop_items s
where s.code = i.item_code and s.kind in ('companion', 'accessory') and i.equipped;

-- An avatar names a hero and, in each slot it uses, a cosmetic of that slot. Whether the child
-- may wear it is checked by set_child_look (a parent, who may update the child directly, decides
-- alone).
create or replace function private.valid_avatar(p_avatar jsonb) returns boolean
language sql immutable
set search_path = ''
as $$
  -- A missing key gives null, which a check constraint would accept: it must give false.
  select coalesce(
    jsonb_typeof(p_avatar) = 'object'
      and not exists (
        select 1 from jsonb_object_keys(p_avatar) k where k not in ('hero', 'wear')
      )
      and jsonb_typeof(p_avatar -> 'hero') = 'string'
      and (p_avatar ->> 'hero') = any (private.hero_ids())
      and jsonb_typeof(p_avatar -> 'wear') = 'object'
      and not exists (
        select 1 from jsonb_each(p_avatar -> 'wear') worn
        where jsonb_typeof(worn.value) <> 'string'
          or (private.cosmetics() -> (worn.value #>> '{}') ->> 'slot') is distinct from worn.key
      ),
    false
  );
$$;

alter table public.children
  add constraint children_avatar_check check (avatar = '{}'::jsonb or private.valid_avatar(avatar));

drop function private.avatar_locks();
drop function private.avatar_parts();

-- The first cosmetic of an avatar the child has not unlocked: a badge not earned, an item not
-- bought. Null when everything is.
create function private.locked_cosmetic(p_child_id uuid, p_avatar jsonb) returns text
language sql stable
set search_path = ''
as $$
  select worn.value
  from jsonb_each_text(p_avatar -> 'wear') worn
  cross join lateral (select private.cosmetics() -> worn.value -> 'unlock' as unlock) item
  where case item.unlock ->> 'kind'
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

-- The child's device (or a parent) sets the child's theme and avatar.
create or replace function public.set_child_look(p_child_id uuid, p_theme_id text, p_avatar jsonb)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_child_id is null or p_child_id not in (select private.accessible_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  if p_theme_id is null or not (p_theme_id = any (private.theme_ids())) then
    raise exception 'invalid_theme' using errcode = 'PT400';
  end if;
  if p_avatar is null or not private.valid_avatar(p_avatar) then
    raise exception 'invalid_avatar' using errcode = 'PT400';
  end if;
  if private.locked_cosmetic(p_child_id, p_avatar) is not null then
    raise exception 'avatar_locked' using errcode = 'PT403';
  end if;

  update public.children c set theme_id = p_theme_id, avatar = p_avatar where c.id = p_child_id;
end;
$$;

-- Puts a cosmetic on the child's hero (taking off the one in its slot), or empties the slot.
create function private.wear(p_child_id uuid, p_slot text, p_cosmetic text) returns void
language sql
set search_path = ''
as $$
  update public.children c
  set avatar = jsonb_set(
    look.avatar,
    '{wear}',
    case
      when p_cosmetic is null then (look.avatar -> 'wear') - p_slot
      else (look.avatar -> 'wear') || jsonb_build_object(p_slot, p_cosmetic)
    end
  )
  from (
    select case when avatar = '{}'::jsonb then private.default_avatar(gender::text) else avatar end
      as avatar
    from public.children where id = p_child_id
  ) look
  where c.id = p_child_id;
$$;

-- The shop ---------------------------------------------------------------------------------------------

-- Buys an item for the child with gems, and wears it: a companion or an accessory on the hero, a
-- victory effect at the end of sessions.
create or replace function public.buy_item(p_child_id uuid, p_item_code text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  item public.shop_items;
  today date;
  current public.progress;
  bought public.child_items;
begin
  if p_child_id is null or p_child_id not in (select private.accessible_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  select * into item from public.shop_items s where s.code = p_item_code;
  if item.id is null then
    raise exception 'item_not_found' using errcode = 'PT404';
  end if;
  -- One purchase at a time per child.
  perform 1 from public.children c where c.id = p_child_id for update;
  if exists (
    select 1 from public.child_items i where i.child_id = p_child_id and i.item_code = item.code
  ) then
    raise exception 'already_owned' using errcode = 'PT409';
  end if;

  today := private.child_today(p_child_id, now());
  current := private.refresh_progress(p_child_id, today);
  if current.gems < item.price_gems then
    raise exception 'not_enough_gems' using errcode = 'PT409';
  end if;

  if item.kind = 'effect' then
    update public.child_items i set equipped = false
    from public.shop_items s
    where i.child_id = p_child_id and s.code = i.item_code and s.kind = item.kind and i.equipped;
  end if;
  insert into public.child_items (child_id, item_code, equipped, bought_at)
  values (p_child_id, item.code, item.kind = 'effect', now())
  returning * into bought;
  if item.kind <> 'effect' then
    perform private.wear(p_child_id, item.kind::text, item.code);
  end if;
  insert into public.gem_transactions (child_id, amount, reason, ref_id, local_date)
  values (p_child_id, -item.price_gems, 'shop', bought.id, today);

  current := private.refresh_progress(p_child_id, today);
  return jsonb_build_object('item_code', item.code, 'total_gems', current.gems);
end;
$$;

-- Wears an item the child owns (taking off the other one of its kind), or takes it off.
create or replace function public.equip_item(p_child_id uuid, p_item_code text, p_equipped boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  owned public.child_items;
  item_kind public.shop_item_kind;
begin
  if p_child_id is null or p_child_id not in (select private.accessible_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  select * into owned from public.child_items i
  where i.child_id = p_child_id and i.item_code = p_item_code
  for update;
  if owned.id is null then
    raise exception 'item_not_owned' using errcode = 'PT404';
  end if;
  select s.kind into item_kind from public.shop_items s where s.code = owned.item_code;

  if item_kind <> 'effect' then
    -- Taking off only empties the slot when this item is the one worn there.
    if p_equipped then
      perform private.wear(p_child_id, item_kind::text, owned.item_code);
    elsif (
      select c.avatar #>> array['wear', item_kind::text] from public.children c
      where c.id = p_child_id
    ) = owned.item_code then
      perform private.wear(p_child_id, item_kind::text, null);
    end if;
    return;
  end if;

  if p_equipped then
    update public.child_items i set equipped = false
    from public.shop_items s
    where i.child_id = p_child_id and s.code = i.item_code and s.kind = item_kind
      and i.id <> owned.id and i.equipped;
  end if;
  update public.child_items i set equipped = p_equipped where i.id = owned.id;
end;
$$;

-- Grants -------------------------------------------------------------------------------------------------

revoke all on function private.hero_ids() from public;
revoke all on function private.cosmetics() from public;
revoke all on function private.default_avatar(text) from public;
revoke all on function private.locked_cosmetic(uuid, jsonb) from public;
revoke all on function private.wear(uuid, text, text) from public;
-- The check constraint runs them as the user who writes the child (a parent).
grant execute on function private.hero_ids() to authenticated;
grant execute on function private.cosmetics() to authenticated;
