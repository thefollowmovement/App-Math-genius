import {
  SHOP_ITEMS,
  awardSchema,
  isChallengeCode,
  levelProgress,
  type Avatar,
  type Award,
  type ChallengeCode,
  type ShopItem,
  type ShopKind,
  type Tables,
  type Unlocked,
} from '@math-genius/shared';

/** Rewards as stored by the server and as the app shows them, without Supabase (testable). */

export type ProgressRow = Pick<
  Tables<'progress'>,
  'xp' | 'gems' | 'streak_current' | 'streak_best' | 'freezes'
>;
/** A chest won and not opened yet. */
export type ChestRow = Pick<Tables<'chests'>, 'id' | 'kind'>;

export type ProgressView = {
  xp: number;
  level: number;
  /** XP earned within the level, out of `toNext`. */
  inLevel: number;
  toNext: number;
  gems: number;
  streak: number;
  bestStreak: number;
  freezes: number;
};

/** Before any award: level 1 and the week's free freeze. */
const NO_PROGRESS: ProgressRow = { xp: 0, gems: 0, streak_current: 0, streak_best: 0, freezes: 1 };

export function progressView(row: ProgressRow | null): ProgressView {
  const { xp, gems, streak_current, streak_best, freezes } = row ?? NO_PROGRESS;
  return {
    xp,
    ...levelProgress(xp),
    gems,
    streak: streak_current,
    bestStreak: streak_best,
    freezes,
  };
}

/** An item bought in the shop. */
export type ItemRow = Pick<Tables<'child_items'>, 'item_code' | 'equipped'>;

/**
 * Progress, chests to open, how many badges the child has earned, the items bought and the
 * cosmetics kept without their condition (child_cosmetics).
 */
export type Rewards = {
  progress: ProgressView;
  chests: ChestRow[];
  badges: number;
  items: ItemRow[];
  kept: string[];
};

export type ItemView<I extends ShopItem> = I & { owned: boolean; worn: boolean };
export type ShopItemView = ItemView<ShopItem>;
/** The items of one kind of the shop (companions get cards of their own). */
export type ShopGroup = {
  [K in ShopKind]: { kind: K; items: ItemView<Extract<ShopItem, { kind: K }>>[] };
}[ShopKind];

/**
 * The shop by kind, with what the child owns and wears: companions and accessories on the hero
 * (the avatar's `wear`), victory effects in the child's items.
 */
export function shopGroups(items: readonly ItemRow[], wear: Avatar['wear']): ShopGroup[] {
  const owned = new Map(items.map((item) => [item.item_code, item.equipped]));
  const view = <I extends ShopItem>(item: I): ItemView<I> => ({
    ...item,
    owned: owned.has(item.code),
    worn: item.kind === 'effect' ? owned.get(item.code) === true : wear[item.kind] === item.code,
  });
  const ofKind = <K extends ShopKind>(kind: K) => ({
    kind,
    items: SHOP_ITEMS.filter(
      (item): item is Extract<ShopItem, { kind: K }> => item.kind === kind,
    ).map(view),
  });
  // In the order of SHOP_KINDS.
  return [ofKind('companion'), ofKind('outfit'), ofKind('accessory'), ofKind('effect')];
}

export type EffectCode = Extract<ShopItem, { kind: 'effect' }>['code'];

/** The victory effect worn at the end of sessions (one this app does not know is left out). */
export function wornEffect(items: readonly ItemRow[]): EffectCode | undefined {
  for (const { item_code: code, equipped } of items) {
    const item = SHOP_ITEMS.find((candidate) => candidate.code === code);
    if (equipped && item?.kind === 'effect') return item.code;
  }
  return undefined;
}

/** What unlocks cosmetics: the badges earned, the items bought and the cosmetics kept. */
export const unlockedOf = (
  earned: readonly { badge_code: string }[],
  items: readonly ItemRow[],
  kept: readonly string[] = [],
): Unlocked => ({
  badges: new Set(earned.map(({ badge_code }) => badge_code)),
  owned: new Set([...items.map(({ item_code }) => item_code), ...kept]),
});

export const parseAward = (value: unknown): Award | null => {
  const parsed = awardSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

/** The award-session Edge Function answers `{ awards: [...] }`. */
export function awardsFromResponse(value: unknown): Award[] {
  if (typeof value !== 'object' || value === null || !('awards' in value)) return [];
  const { awards } = value;
  return Array.isArray(awards) ? awards.flatMap((award) => parseAward(award) ?? []) : [];
}

export type OpenedChest = { kind: 'common' | 'rare'; gems: number; total: number };

/** What open_chest returns. */
export function parseOpenedChest(value: unknown): OpenedChest | null {
  if (typeof value !== 'object' || value === null) return null;
  const { kind, gems, total_gems: total } = value as Record<string, unknown>;
  if ((kind !== 'common' && kind !== 'rare') || typeof gems !== 'number') return null;
  return typeof total === 'number' ? { kind, gems, total } : null;
}

/** What the end-of-session screen shows about rewards. */
export type AwardState =
  { status: 'waiting' } | { status: 'computing' } | { status: 'ready'; award: Award };

export function awardState(saved: boolean, award: Award | null | undefined): AwardState {
  if (award) return { status: 'ready', award };
  return saved ? { status: 'computing' } : { status: 'waiting' };
}

/** This week's challenge, as weekly_challenge returns it. */
export type WeeklyChallenge = {
  code: ChallengeCode;
  threshold: number;
  progress: number;
  gems: number;
  completed: boolean;
};

/** Null for a challenge this version of the app does not know (a newer server). */
export function parseWeeklyChallenge(value: unknown): WeeklyChallenge | null {
  if (typeof value !== 'object' || value === null) return null;
  const { code, threshold, progress, gems, completed } = value as Record<string, unknown>;
  if (typeof code !== 'string' || !isChallengeCode(code)) return null;
  if (typeof threshold !== 'number' || typeof progress !== 'number') return null;
  if (typeof gems !== 'number' || typeof completed !== 'boolean') return null;
  return { code, threshold, progress, gems, completed };
}
