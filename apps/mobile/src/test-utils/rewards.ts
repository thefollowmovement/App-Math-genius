import type { Award } from '@math-genius/shared';

import { progressView, type Rewards } from '@/data/rewards-model';

/** The award of a validated daily session that took the streak from 3 to 4 days. */
export const award = (overrides: Partial<Award> = {}): Award => ({
  session_id: 'session-1',
  xp: 340,
  verified_correct: 32,
  answered: 40,
  goal_met: true,
  gems: 5,
  chest: { id: 'chest-1', kind: 'common' },
  level: 5,
  level_before: 4,
  xp_total: 1040,
  streak: 4,
  streak_before: 3,
  streak_best: 6,
  badges: [],
  boss: null,
  challenge: null,
  ...overrides,
});

export const rewards = (chests: Rewards['chests'] = []): Rewards => ({
  progress: progressView({ xp: 1040, gems: 45, streak_current: 4, streak_best: 6, freezes: 1 }),
  chests,
  badges: 3,
  items: [
    { item_code: 'kitten', equipped: true },
    { item_code: 'bow', equipped: false },
  ],
});
