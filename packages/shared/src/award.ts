import { z } from 'zod';

/** What award_session returns for a finished session (supabase/migrations/*_rewards.sql). */
export const awardSchema = z.object({
  session_id: z.string(),
  xp: z.int(),
  verified_correct: z.int(),
  answered: z.int(),
  goal_met: z.boolean(),
  gems: z.int(),
  chest: z.object({ id: z.string(), kind: z.enum(['common', 'rare']) }).nullable(),
  level: z.int(),
  level_before: z.int(),
  xp_total: z.int(),
  streak: z.int(),
  streak_before: z.int(),
  streak_best: z.int(),
  /** Badges this session granted (supabase/migrations/*_badges.sql); absent from older awards. */
  badges: z.array(z.string()).default([]),
  /** A boss session only: its island and whether it was beaten (*_islands.sql). */
  boss: z
    .object({ grade: z.string(), domain: z.string(), passed: z.boolean(), first: z.boolean() })
    .nullable()
    .default(null),
  /** The weekly challenge this session completed, and its gems (*_challenges.sql). */
  challenge: z.object({ code: z.string(), gems: z.int() }).nullable().default(null),
  /** The parent's rewards this session unlocked (*_parent_rewards.sql). */
  parent_rewards: z.array(z.object({ id: z.string(), title: z.string() })).default([]),
});
export type Award = z.infer<typeof awardSchema>;
