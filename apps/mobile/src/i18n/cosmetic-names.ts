import {
  SHOP_ITEMS,
  isCompanionId,
  isShopItemCode,
  type Avatar,
  type CosmeticId,
  type CosmeticUnlock,
  type EarnedCosmeticId,
  type ShopItemCode,
} from '@math-genius/shared';

import { strings } from './index';

const t = strings.look;

const isEarned = (id: string): id is EarnedCosmeticId => id in t.cosmetics;

/** A shop item's name, a companion's included. */
export const shopItemName = (code: ShopItemCode): string =>
  isCompanionId(code) ? strings.companions.items[code].name : strings.shop.items[code].name;

/**
 * A cosmetic's name: a companion's short name, the shop's for what it sells (a shop cosmetic has
 * the code of its item), the editor's for the others.
 */
export function cosmeticName(id: CosmeticId): string {
  if (isCompanionId(id)) return strings.companions.items[id].name;
  if (isEarned(id)) return t.cosmetics[id];
  return isShopItemCode(id) ? shopItemName(id) : id;
}

/** Why a cosmetic cannot be worn yet. */
export function lockedText(cosmetic: CosmeticId, missing: CosmeticUnlock): string {
  const name = cosmeticName(cosmetic);
  if (missing.kind === 'badge')
    return t.lockedBadge(name, strings.badges.items[missing.badge].title);
  if (missing.kind === 'shop') {
    const price = SHOP_ITEMS.find(({ code }) => code === missing.item)?.price ?? 0;
    return t.lockedShop(name, price);
  }
  return name;
}

/** The spoken label of the child's portrait: the hero, and its companion and accessory. */
export function portraitLabel(avatar: Avatar): string {
  const hero = strings.heroes.items[avatar.hero].name;
  const { companion, accessory } = avatar.wear;
  const wearing = [companion, accessory].flatMap((id) => (id ? [cosmeticName(id)] : []));
  return strings.heroes.portrait(hero, wearing);
}
