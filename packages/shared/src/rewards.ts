/**
 * Reward rules. XP, gems, streak and chests are computed on the server only
 * (supabase/migrations/*_rewards.sql), from regraded answers; the app uses these constants to
 * display them. The SQL applies the same values: change both.
 */

export const XP_PER_CORRECT = 10;
/** Every 5 right answers in a row in a session earn this much more. */
export const COMBO_LENGTH = 5;
export const COMBO_XP = 10;
/** A validated daily session. */
export const SESSION_GEMS = 5;
export const FREEZE_PRICE = 30;
export const MAX_FREEZES = 3;
/** Every 7 days of streak, the chest is a rare one. */
export const RARE_CHEST_EVERY = 7;
/** A boss (end of an island) is beaten with this share of right answers, by the server's grading. */
export const BOSS_PASS_RATE = 0.8;
/** Exercises of a boss: 2 per skill of the island, within these bounds. */
export const BOSS_MIN_EXERCISES = 6;
export const BOSS_MAX_EXERCISES = 10;

/** XP needed to reach a level: 0, 100, 300, 600, 1000… (50 × L × (L − 1)). */
export const xpForLevel = (level: number): number => 50 * level * (level - 1);

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
}

/** Where a total of XP stands within its level, for a progress bar. */
export function levelProgress(xp: number): { level: number; inLevel: number; toNext: number } {
  const level = levelForXp(xp);
  const start = xpForLevel(level);
  return { level, inLevel: xp - start, toNext: xpForLevel(level + 1) - start };
}
