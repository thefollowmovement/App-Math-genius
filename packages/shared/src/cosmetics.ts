import type { BadgeCode } from './badges';
import type { ShopItemCode } from './shop';

/**
 * Cosmetics: what the child's hero wears or has around it. Data only: one item is an id, a slot,
 * an unlock condition and a visual reference. The migration *_neon_heroes.sql holds the same ids,
 * slots and conditions (cosmetics.test.ts compares them) and checks them when the child wears
 * one. Ids are stored: never rename one.
 */
export const COSMETIC_SLOTS = [
  'head',
  'top',
  'bottom',
  'shoes',
  'accessory',
  'aura',
  'frame',
  'companion',
] as const;
export type CosmeticSlot = (typeof COSMETIC_SLOTS)[number];

/** How a cosmetic is earned: always there, with a badge, or bought in the shop (with gems). */
export type CosmeticUnlock =
  { kind: 'free' } | { kind: 'badge'; badge: BadgeCode } | { kind: 'shop'; item: ShopItemCode };

/**
 * How a cosmetic is drawn: a reference the app resolves, interchangeable without touching the
 * catalog, the shop or the badges.
 * - overlay: drawn around the hero, the same for every hero (an aura behind, a frame around, a
 *   sticker, a companion beside). `art` names a drawing of apps/mobile/src/components/hero.
 * - layer: a layer of the hero's own animation (Rive), switched on by name; it changes the hero
 *   drawing. Heroes drawn as still images cannot show these yet: the slots head, top, bottom and
 *   shoes wait for them.
 */
export type CosmeticVisual = { kind: 'overlay'; art: string } | { kind: 'layer'; layer: string };

type CosmeticDefinition = {
  id: string;
  slot: CosmeticSlot;
  unlock: CosmeticUnlock;
  visual: CosmeticVisual;
};

const shopItem = <C extends ShopItemCode, S extends CosmeticSlot>(id: C, slot: S) =>
  ({
    id,
    slot,
    unlock: { kind: 'shop', item: id },
    visual: { kind: 'overlay', art: `emoji-${id}` },
  }) as const;

export const COSMETICS = [
  // Neon auras behind the hero.
  {
    id: 'aura-pink',
    slot: 'aura',
    unlock: { kind: 'free' },
    visual: { kind: 'overlay', art: 'aura-pink' },
  },
  {
    id: 'aura-cyan',
    slot: 'aura',
    unlock: { kind: 'badge', badge: 'streak-3' },
    visual: { kind: 'overlay', art: 'aura-cyan' },
  },
  {
    id: 'aura-gold',
    slot: 'aura',
    unlock: { kind: 'badge', badge: 'streak-7' },
    visual: { kind: 'overlay', art: 'aura-gold' },
  },
  {
    id: 'aura-green',
    slot: 'aura',
    unlock: { kind: 'badge', badge: 'combo-10' },
    visual: { kind: 'overlay', art: 'aura-green' },
  },
  {
    id: 'aura-rainbow',
    slot: 'aura',
    unlock: { kind: 'badge', badge: 'streak-30' },
    visual: { kind: 'overlay', art: 'aura-rainbow' },
  },
  // Frames around the hero's portrait.
  {
    id: 'frame-neon',
    slot: 'frame',
    unlock: { kind: 'free' },
    visual: { kind: 'overlay', art: 'frame-neon' },
  },
  {
    id: 'frame-stars',
    slot: 'frame',
    unlock: { kind: 'badge', badge: 'perfect-1' },
    visual: { kind: 'overlay', art: 'frame-stars' },
  },
  {
    id: 'frame-crown',
    slot: 'frame',
    unlock: { kind: 'badge', badge: 'island-1' },
    visual: { kind: 'overlay', art: 'frame-crown' },
  },
  {
    id: 'frame-lightning',
    slot: 'frame',
    unlock: { kind: 'badge', badge: 'combo-25' },
    visual: { kind: 'overlay', art: 'frame-lightning' },
  },
  {
    id: 'frame-gold',
    slot: 'frame',
    unlock: { kind: 'badge', badge: 'boss-perfect' },
    visual: { kind: 'overlay', art: 'frame-gold' },
  },
  // Companions: from the shop, or earned.
  shopItem('kitten', 'companion'),
  shopItem('puppy', 'companion'),
  shopItem('fox', 'companion'),
  shopItem('panda', 'companion'),
  shopItem('octopus', 'companion'),
  shopItem('unicorn', 'companion'),
  shopItem('dragon', 'companion'),
  {
    id: 'pixel-robot',
    slot: 'companion',
    unlock: { kind: 'badge', badge: 'level-10' },
    visual: { kind: 'overlay', art: 'emoji-pixel-robot' },
  },
  {
    id: 'glitch-cube',
    slot: 'companion',
    unlock: { kind: 'badge', badge: 'island-2' },
    visual: { kind: 'overlay', art: 'emoji-glitch-cube' },
  },
  // Accessories, as stickers on the portrait.
  shopItem('bow', 'accessory'),
  shopItem('cap', 'accessory'),
  shopItem('sunglasses', 'accessory'),
  shopItem('top-hat', 'accessory'),
  shopItem('crown', 'accessory'),
  {
    id: 'golden-mic',
    slot: 'accessory',
    unlock: { kind: 'badge', badge: 'sessions-25' },
    visual: { kind: 'overlay', art: 'emoji-golden-mic' },
  },
] as const satisfies readonly CosmeticDefinition[];

export type Cosmetic = (typeof COSMETICS)[number];
export type CosmeticId = Cosmetic['id'];
/** Cosmetics that are not shop items: their names live with the editor's texts. */
export type EarnedCosmeticId = Exclude<CosmeticId, ShopItemCode>;

const BY_ID: ReadonlyMap<string, Cosmetic> = new Map(COSMETICS.map((item) => [item.id, item]));

export const cosmeticOf = (id: string): Cosmetic | undefined => BY_ID.get(id);

export const cosmeticsOf = (slot: CosmeticSlot): Cosmetic[] =>
  COSMETICS.filter((item) => item.slot === slot);

/** What the child has, against which unlock conditions are checked. */
export type Unlocked = { badges: ReadonlySet<string>; owned: ReadonlySet<string> };

/** Null when the child can wear it; otherwise the condition still to meet. */
export function missingUnlock(cosmetic: Cosmetic, unlocked: Unlocked): CosmeticUnlock | null {
  const { unlock } = cosmetic;
  if (unlock.kind === 'badge' && !unlocked.badges.has(unlock.badge)) return unlock;
  if (unlock.kind === 'shop' && !unlocked.owned.has(unlock.item)) return unlock;
  return null;
}
