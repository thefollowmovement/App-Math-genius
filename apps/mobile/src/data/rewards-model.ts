import { awardSchema, levelProgress, type Award, type Tables } from '@math-genius/shared';

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

/** Progress, chests to open and how many badges the child has earned. */
export type Rewards = { progress: ProgressView; chests: ChestRow[]; badges: number };

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
