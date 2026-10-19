import {
  SHOP_ITEMS,
  cosmeticOf,
  type Avatar,
  type Cosmetic,
  type CosmeticId,
  type CosmeticUnlock,
} from '@math-genius/shared';

import { strings } from './index';

const t = strings.look;

type ShopCosmetic = Extract<Cosmetic, { unlock: { kind: 'shop' } }>;
const isSold = (cosmetic: Cosmetic): cosmetic is ShopCosmetic => cosmetic.unlock.kind === 'shop';

/** A cosmetic's name: the shop's for what it sells, the editor's for the others. */
export function cosmeticName(id: CosmeticId): string {
  const cosmetic = cosmeticOf(id);
  if (!cosmetic) return id;
  return isSold(cosmetic)
    ? strings.shop.items[cosmetic.unlock.item].name
    : t.cosmetics[cosmetic.id];
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
