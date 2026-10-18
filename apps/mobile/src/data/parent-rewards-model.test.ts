import { progressView } from './rewards-model';
import {
  nextReward,
  rewardStatus,
  rewardViews,
  standing,
  type ParentRewardRow,
} from './parent-rewards-model';

const row = (overrides: Partial<ParentRewardRow>): ParentRewardRow => ({
  id: 'r',
  title: 'Une glace',
  goal: 'streak',
  target: 7,
  unlocked_at: null,
  given_at: null,
  ...overrides,
});
const at = standing(
  progressView({ xp: 1500, gems: 0, streak_current: 4, streak_best: 6, freezes: 1 }),
  1,
);

describe('parent rewards', () => {
  it('know their status from what the server and the parent did', () => {
    expect(rewardStatus(row({}))).toBe('locked');
    expect(rewardStatus(row({ unlocked_at: '2026-10-18' }))).toBe('unlocked');
    expect(rewardStatus(row({ unlocked_at: '2026-10-18', given_at: '2026-10-19' }))).toBe('given');
  });

  it('show how far the child is on each goal, capped at the target', () => {
    expect(at).toEqual({ streak: 4, xp: 1500, islands: 1 });
    const views = rewardViews(
      [
        row({ id: 'streak' }),
        row({ id: 'xp', goal: 'xp', target: 1000 }),
        row({ id: 'islands', goal: 'islands', target: 4 }),
      ],
      at,
    );
    expect(views.map((view) => view.value)).toEqual([4, 1000, 1]);
  });

  it('put a reward to ask for first, then the closest to unlock', () => {
    const locked = rewardViews(
      [row({ id: 'far', goal: 'islands', target: 4 }), row({ id: 'close', target: 5 })],
      at,
    );
    expect(nextReward(locked)?.id).toBe('close');
    const unlocked = rewardViews([...locked, row({ id: 'ask', unlocked_at: '2026-10-18' })], at);
    expect(nextReward(unlocked)?.id).toBe('ask');
    expect(nextReward(rewardViews([row({ unlocked_at: 'x', given_at: 'y' })], at))).toBeNull();
  });
});
