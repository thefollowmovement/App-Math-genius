import { z } from 'zod';

import {
  COSMETICS,
  COSMETIC_SLOTS,
  cosmeticOf,
  type CosmeticId,
  type CosmeticSlot,
} from './cosmetics';
import { HERO_IDS, type HeroId } from './heroes';

/**
 * The child's avatar: the hero they picked and what it wears, one cosmetic per slot. Stored as
 * JSON on the child (children.avatar) and checked by the database (*_neon_heroes.sql), which
 * also checks that each cosmetic is unlocked. The hero's drawing never changes: cosmetics are
 * drawn around it (or, later, as layers of its animation).
 */
export type Avatar = { hero: HeroId; wear: Partial<Record<CosmeticSlot, CosmeticId>> };

const COSMETIC_IDS = COSMETICS.map((item) => item.id);

export const avatarSchema = z
  .object({
    hero: z.enum(HERO_IDS),
    wear: z.partialRecord(z.enum(COSMETIC_SLOTS), z.enum(COSMETIC_IDS)),
  })
  .strict()
  // Each cosmetic in its own slot.
  .refine(({ wear }) => Object.entries(wear).every(([slot, id]) => cosmeticOf(id)?.slot === slot));

/** The theme and hero preselected from the profile (docs/specs.md): everything stays open. */
export const DEFAULT_LOOKS = {
  girl: { theme: 'neon', avatar: { hero: 'nova', wear: { frame: 'frame-neon' } } },
  boy: { theme: 'neon', avatar: { hero: 'kai', wear: { frame: 'frame-neon' } } },
} as const satisfies Record<'girl' | 'boy', { theme: string; avatar: Avatar }>;

/** The stored avatar, or the default one when none was chosen yet ({}) or it is unreadable. */
export function avatarOf(stored: unknown, gender: 'girl' | 'boy'): Avatar {
  const parsed = avatarSchema.safeParse(stored);
  return parsed.success ? parsed.data : DEFAULT_LOOKS[gender].avatar;
}
