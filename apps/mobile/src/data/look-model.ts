import {
  COSMETIC_SLOTS,
  SHOP_ITEMS,
  avatarOf,
  cosmeticOf,
  missingUnlock,
  type Avatar,
  type CosmeticId,
  type CosmeticSlot,
  type CosmeticUnlock,
  type HeroId,
  type Unlocked,
} from '@math-genius/shared';
import { DEFAULT_THEME, isThemeId, type ThemeId } from '@math-genius/ui';

import type { Child } from './children';

export type Look = { theme: ThemeId; avatar: Avatar };

/** The child's theme and avatar as stored, or the defaults of the profile. */
export function lookOf(child: Pick<Child, 'theme_id' | 'avatar' | 'gender'>): Look {
  return {
    theme: isThemeId(child.theme_id) ? child.theme_id : DEFAULT_THEME,
    avatar: avatarOf(child.avatar, child.gender),
  };
}

export const sameLook = (a: Look, b: Look) =>
  a.theme === b.theme &&
  a.avatar.hero === b.avatar.hero &&
  COSMETIC_SLOTS.every((slot) => a.avatar.wear[slot] === b.avatar.wear[slot]);

export const withHero = (look: Look, hero: HeroId): Look => ({
  ...look,
  avatar: { ...look.avatar, hero },
});

/** A cosmetic the child tried before unlocking it, and what it waits for. */
export type LockedHint = { cosmetic: CosmeticId; missing: CosmeticUnlock };

/**
 * The look with a cosmetic worn in its slot (or the slot emptied with null), or what the
 * cosmetic still waits for: a badge, or a purchase. The server checks it again.
 */
export function pickCosmetic(
  look: Look,
  slot: CosmeticSlot,
  id: CosmeticId | null,
  unlocked: Unlocked,
): { look: Look } | { locked: LockedHint } | null {
  const { [slot]: _removed, ...others } = look.avatar.wear;
  if (id === null) return { look: { ...look, avatar: { ...look.avatar, wear: others } } };
  const cosmetic = cosmeticOf(id);
  if (!cosmetic || cosmetic.slot !== slot) return null;
  const missing = missingUnlock(cosmetic, unlocked);
  if (missing) return { locked: { cosmetic: id, missing } };
  return { look: { ...look, avatar: { ...look.avatar, wear: { ...others, [slot]: id } } } };
}

/** The price of a cosmetic sold in the shop. */
export const shopPrice = (item: string) => SHOP_ITEMS.find(({ code }) => code === item)?.price ?? 0;
