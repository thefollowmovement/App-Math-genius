-- Phase 6g: the heroes' outfits (docs/design/tenues).
--
-- Three outfits (packages/shared/src/outfits.ts) join the cosmetics, in the outfit slot: Sport
-- (100 gems) and Magie (200 gems) in the shop, Astronaute with the badge of the first island
-- completed. One is worn at a time, in children.avatar.wear.outfit; without one, the hero wears
-- its stage outfit (« Tenue de scène »), always there. Buying an outfit wears it, like a
-- companion or an accessory (buy_item and equip_item write the avatar's wear for every kind but
-- victory effects). cosmetics.test.ts and shop.test.ts compare the catalogs below with the app's.

-- Every cosmetic, by id: its slot and how it is unlocked.
create or replace function private.cosmetics() returns jsonb
language sql immutable
set search_path = ''
as $$
  select '{"aura-pink": {"slot": "aura", "unlock": {"kind": "free"}}, "aura-cyan": {"slot": "aura", "unlock": {"kind": "badge", "badge": "streak-3"}}, "aura-gold": {"slot": "aura", "unlock": {"kind": "badge", "badge": "streak-7"}}, "aura-green": {"slot": "aura", "unlock": {"kind": "badge", "badge": "combo-10"}}, "aura-rainbow": {"slot": "aura", "unlock": {"kind": "badge", "badge": "streak-30"}}, "frame-neon": {"slot": "frame", "unlock": {"kind": "free"}}, "frame-stars": {"slot": "frame", "unlock": {"kind": "badge", "badge": "perfect-1"}}, "frame-crown": {"slot": "frame", "unlock": {"kind": "badge", "badge": "island-1"}}, "frame-lightning": {"slot": "frame", "unlock": {"kind": "badge", "badge": "combo-25"}}, "frame-gold": {"slot": "frame", "unlock": {"kind": "badge", "badge": "boss-perfect"}}, "hibou": {"slot": "companion", "unlock": {"kind": "badge", "badge": "first-exercise"}}, "lapin": {"slot": "companion", "unlock": {"kind": "shop", "item": "lapin"}}, "dragon": {"slot": "companion", "unlock": {"kind": "shop", "item": "dragon"}}, "licorne": {"slot": "companion", "unlock": {"kind": "shop", "item": "licorne"}}, "tigre": {"slot": "companion", "unlock": {"kind": "badge", "badge": "streak-7"}}, "renard": {"slot": "companion", "unlock": {"kind": "shop", "item": "renard"}}, "chat": {"slot": "companion", "unlock": {"kind": "badge", "badge": "island-2"}}, "phenix": {"slot": "companion", "unlock": {"kind": "badge", "badge": "level-10"}}, "sport": {"slot": "outfit", "unlock": {"kind": "shop", "item": "sport"}}, "astronaute": {"slot": "outfit", "unlock": {"kind": "badge", "badge": "island-1"}}, "magie": {"slot": "outfit", "unlock": {"kind": "shop", "item": "magie"}}, "bow": {"slot": "accessory", "unlock": {"kind": "shop", "item": "bow"}}, "cap": {"slot": "accessory", "unlock": {"kind": "shop", "item": "cap"}}, "sunglasses": {"slot": "accessory", "unlock": {"kind": "shop", "item": "sunglasses"}}, "top-hat": {"slot": "accessory", "unlock": {"kind": "shop", "item": "top-hat"}}, "crown": {"slot": "accessory", "unlock": {"kind": "shop", "item": "crown"}}, "golden-mic": {"slot": "accessory", "unlock": {"kind": "badge", "badge": "sessions-25"}}}'::jsonb;
$$;

-- The whole catalog, in the shop's order (shop.test.ts reads the last one the migrations write).
-- Positions are unique: they move out of the way first.
update public.shop_items set position = position + 100;

insert into public.shop_items (code, kind, price_gems, position) values
  ('lapin', 'companion', 80, 1),
  ('dragon', 'companion', 120, 2),
  ('licorne', 'companion', 150, 3),
  ('renard', 'companion', 250, 4),
  ('sport', 'outfit', 100, 5),
  ('magie', 'outfit', 200, 6),
  ('bow', 'accessory', 30, 7),
  ('cap', 'accessory', 30, 8),
  ('sunglasses', 'accessory', 40, 9),
  ('top-hat', 'accessory', 60, 10),
  ('crown', 'accessory', 120, 11),
  ('confetti', 'effect', 50, 12),
  ('sparkles', 'effect', 50, 13),
  ('rainbow', 'effect', 80, 14),
  ('fireworks', 'effect', 120, 15)
on conflict (code) do update
  set kind = excluded.kind, price_gems = excluded.price_gems, position = excluded.position;
