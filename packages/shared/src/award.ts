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
});
export type Award = z.infer<typeof awardSchema>;
