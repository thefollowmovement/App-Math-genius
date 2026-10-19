import { z } from 'zod';

/**
 * Rewards from the parent: a real-life reward unlocked by a goal (supabase/migrations/
 * *_parent_rewards.sql, enum parent_reward_goal). The server unlocks them; the parent gives them.
 */

export const PARENT_REWARD_GOALS = ['streak', 'xp', 'islands'] as const;
export type ParentRewardGoal = (typeof PARENT_REWARD_GOALS)[number];

export const PARENT_REWARD_TITLE_MAX = 60;

/** The targets offered for each goal. */
export const PARENT_REWARD_TARGETS: Record<ParentRewardGoal, readonly number[]> = {
  streak: [3, 5, 7, 10, 14, 21, 30, 50, 100],
  xp: [500, 1000, 2000, 3000, 5000, 10000],
  islands: [1, 2, 3, 4],
};

export const parentRewardSchema = z.object({
  title: z.string().trim().min(1).max(PARENT_REWARD_TITLE_MAX),
  goal: z.enum(PARENT_REWARD_GOALS),
  target: z.int().min(1).max(100000),
});
export type ParentRewardInput = z.infer<typeof parentRewardSchema>;
