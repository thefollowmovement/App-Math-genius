import type { ParentRewardGoal, Tables } from '@math-genius/shared';

import type { ProgressView } from './rewards-model';

/** The parent's rewards as stored, and where the child stands on their goals (testable). */

export type ParentRewardRow = Pick<
  Tables<'parent_rewards'>,
  'id' | 'title' | 'goal' | 'target' | 'unlocked_at' | 'given_at'
>;
export type ParentRewardStatus = 'locked' | 'unlocked' | 'given';
export type Standing = Record<ParentRewardGoal, number>;
export type ParentRewardView = ParentRewardRow & {
  status: ParentRewardStatus;
  /** How far the child is, capped at the target. */
  value: number;
};

export function rewardStatus(row: ParentRewardRow): ParentRewardStatus {
  if (row.given_at) return 'given';
  return row.unlocked_at ? 'unlocked' : 'locked';
}

/** The child's streak, XP and completed islands, from the rewards cache. */
export const standing = (progress: ProgressView | undefined, islands: number): Standing => ({
  streak: progress?.streak ?? 0,
  xp: progress?.xp ?? 0,
  islands,
});

export function rewardViews(rows: readonly ParentRewardRow[], at: Standing): ParentRewardView[] {
  return rows.map((row) => {
    const status = rewardStatus(row);
    const value = status === 'locked' ? Math.min(at[row.goal], row.target) : row.target;
    return { ...row, status, value };
  });
}

/**
 * The reward the child's home shows: one to ask for first, then the locked one closest to its
 * goal. None once every reward was given.
 */
export function nextReward(views: readonly ParentRewardView[]): ParentRewardView | null {
  const unlocked = views.find((view) => view.status === 'unlocked');
  if (unlocked) return unlocked;
  const locked = views.filter((view) => view.status === 'locked');
  return locked.reduce<ParentRewardView | null>(
    (best, view) => (!best || view.value / view.target > best.value / best.target ? view : best),
    null,
  );
}
