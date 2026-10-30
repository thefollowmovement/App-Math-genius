import type { Award } from '@math-genius/shared';

import type { ParentRewardView } from '@/data/parent-rewards-model';
import { progressView, type Rewards } from '@/data/rewards-model';
import type { ParentRewardsState } from '@/screens/child-detail';

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
  parent_rewards: [],
  game: null,
  ...overrides,
});

export const rewards = (chests: Rewards['chests'] = []): Rewards => ({
  progress: progressView({ xp: 1040, gems: 45, streak_current: 4, streak_best: 6, freezes: 1 }),
  chests,
  badges: 3,
  items: [
    { item_code: 'renard', equipped: false },
    { item_code: 'bow', equipped: false },
  ],
  kept: [],
});

/** A cinema trip unlocked by 7 days of streak (4 so far), and a book already given. */
export const parentRewards = (overrides: Partial<ParentRewardsState> = {}): ParentRewardsState => ({
  rewards: [
    parentReward({
      id: 'cinema',
      title: 'Une sortie au cinéma',
      goal: 'streak',
      target: 7,
      value: 4,
    }),
    parentReward({
      id: 'book',
      title: 'Un livre',
      goal: 'xp',
      target: 1000,
      value: 1000,
      status: 'given',
      unlocked_at: '2026-10-10T18:00:00Z',
      given_at: '2026-10-11T10:00:00Z',
    }),
  ],
  creating: false,
  busyId: null,
  error: null,
  onCreate: jest.fn(),
  onGive: jest.fn(),
  onRemove: jest.fn(),
  ...overrides,
});

export const parentReward = (overrides: Partial<ParentRewardView> = {}): ParentRewardView => ({
  id: 'reward-1',
  title: 'Une glace',
  goal: 'islands',
  target: 1,
  value: 0,
  status: 'locked',
  unlocked_at: null,
  given_at: null,
  ...overrides,
});
