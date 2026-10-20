import type { Avatar } from './avatar';
import type { CosmeticUnlock } from './cosmetics';
import type { HeroId } from './heroes';

/**
 * Outfits (docs/design/tenues): the hero dressed differently, every pose drawn again. Each is a
 * cosmetic of the `outfit` slot (cosmetics.ts builds them from this list), one worn at a time.
 * Without one, the hero wears its stage outfit, always there (« Tenue de scène »). Ids are
 * stored in the child's avatar: never rename one. Names live in the app (fr.ts,
 * `strings.outfits`).
 */
type OutfitDefinition = { id: string; unlock: CosmeticUnlock };

export const OUTFITS = [
  { id: 'sport', unlock: { kind: 'shop', item: 'sport' } },
  { id: 'astronaute', unlock: { kind: 'badge', badge: 'island-1' } },
  { id: 'magie', unlock: { kind: 'shop', item: 'magie' } },
] as const satisfies readonly OutfitDefinition[];

export type Outfit = (typeof OUTFITS)[number];
export type OutfitId = Outfit['id'];

const IDS: ReadonlySet<string> = new Set(OUTFITS.map(({ id }) => id));

export const isOutfitId = (id: string): id is OutfitId => IDS.has(id);

/** How the hero is drawn: which hero, in which outfit (null: its stage outfit). */
export type HeroLook = { hero: HeroId; outfit: OutfitId | null };

/** The outfit the hero wears, or null for its stage outfit. */
export function outfitOf(avatar: Avatar): OutfitId | null {
  const id = avatar.wear.outfit;
  return id !== undefined && isOutfitId(id) ? id : null;
}

export const heroLook = (avatar: Avatar): HeroLook => ({
  hero: avatar.hero,
  outfit: outfitOf(avatar),
});
