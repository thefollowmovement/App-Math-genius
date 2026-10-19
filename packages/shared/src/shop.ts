/**
 * The shop: items bought with gems, never with real money (docs/specs.md, Gamification). The last
 * migration that writes the catalog (*_companions.sql) holds the same one, in the same order
 * (shop.test.ts compares them). Codes are stored with each child's items: never rename one.
 * Streak freezes are sold too, by buy_freeze (FREEZE_PRICE in rewards.ts). Companions sold here
 * are those of companions.ts unlocked in the shop.
 */

export const SHOP_KINDS = ['companion', 'accessory', 'effect'] as const;
export type ShopKind = (typeof SHOP_KINDS)[number];

type ShopItemDefinition = { code: string; kind: ShopKind; price: number };

export const SHOP_ITEMS = [
  { code: 'lapin', kind: 'companion', price: 80 },
  { code: 'dragon', kind: 'companion', price: 120 },
  { code: 'licorne', kind: 'companion', price: 150 },
  { code: 'renard', kind: 'companion', price: 250 },
  { code: 'bow', kind: 'accessory', price: 30 },
  { code: 'cap', kind: 'accessory', price: 30 },
  { code: 'sunglasses', kind: 'accessory', price: 40 },
  { code: 'top-hat', kind: 'accessory', price: 60 },
  { code: 'crown', kind: 'accessory', price: 120 },
  { code: 'confetti', kind: 'effect', price: 50 },
  { code: 'sparkles', kind: 'effect', price: 50 },
  { code: 'rainbow', kind: 'effect', price: 80 },
  { code: 'fireworks', kind: 'effect', price: 120 },
] as const satisfies readonly ShopItemDefinition[];

export type ShopItem = (typeof SHOP_ITEMS)[number];
export type ShopItemCode = ShopItem['code'];
/** What the avatar wears (apps/mobile/src/components/hero draws each one). */
export type AccessoryCode = Extract<ShopItem, { kind: 'accessory' }>['code'];

const SHOP_CODES: ReadonlySet<string> = new Set(SHOP_ITEMS.map((item) => item.code));

export const isShopItemCode = (code: string): code is ShopItemCode => SHOP_CODES.has(code);
