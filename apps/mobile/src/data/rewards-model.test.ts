import { award } from '@/test-utils/rewards';

import {
  awardState,
  awardsFromResponse,
  parseOpenedChest,
  progressView,
  shopGroups,
  wornItems,
  parseWeeklyChallenge,
} from './rewards-model';

describe('rewards from the server', () => {
  it('start at level 1 with the week’s free freeze', () => {
    expect(progressView(null)).toEqual({
      xp: 0,
      level: 1,
      inLevel: 0,
      toNext: 100,
      gems: 0,
      streak: 0,
      bestStreak: 0,
      freezes: 1,
    });
  });

  it('place the XP within its level', () => {
    expect(
      progressView({ xp: 1040, gems: 45, streak_current: 4, streak_best: 6, freezes: 2 }),
    ).toMatchObject({ level: 5, inLevel: 40, toNext: 500, streak: 4, bestStreak: 6 });
  });

  it('read the Edge Function’s answer and drop anything malformed', () => {
    expect(awardsFromResponse({ awards: [award(), { xp: 'lots' }] })).toEqual([award()]);
    expect(awardsFromResponse({ error: 'child_id' })).toEqual([]);
    expect(awardsFromResponse(null)).toEqual([]);
  });

  it('read an opened chest', () => {
    expect(parseOpenedChest({ kind: 'rare', gems: 30, total_gems: 75 })).toEqual({
      kind: 'rare',
      gems: 30,
      total: 75,
    });
    expect(parseOpenedChest({ kind: 'gold', gems: 30, total_gems: 75 })).toBeNull();
  });

  it('say whether the rewards are on their way', () => {
    expect(awardState(false, undefined)).toEqual({ status: 'waiting' });
    expect(awardState(true, null)).toEqual({ status: 'computing' });
    expect(awardState(true, award())).toEqual({ status: 'ready', award: award() });
  });
});

describe('shop', () => {
  const items = [
    { item_code: 'kitten', equipped: true },
    { item_code: 'bow', equipped: false },
    { item_code: 'crown', equipped: true },
    { item_code: 'from-the-future', equipped: true },
  ];

  it('lists the catalog by kind with what the child owns and wears', () => {
    const groups = shopGroups(items);
    expect(groups.map((group) => group.kind)).toEqual(['companion', 'accessory', 'effect']);
    const all = groups.flatMap((group) => group.items);
    expect(all.find((item) => item.code === 'kitten')).toMatchObject({ owned: true, worn: true });
    expect(all.find((item) => item.code === 'bow')).toMatchObject({ owned: true, worn: false });
    expect(all.find((item) => item.code === 'fox')).toMatchObject({ owned: false, worn: false });
  });

  it('knows the item worn of each kind', () => {
    expect(wornItems(items)).toEqual({ companion: 'kitten', accessory: 'crown' });
    expect(wornItems([])).toEqual({});
  });
});

describe('parseWeeklyChallenge', () => {
  it('reads what weekly_challenge returns, and leaves out unknown challenges', () => {
    const value = {
      code: 'daily-5',
      threshold: 5,
      gems: 20,
      week_start: '2026-10-12',
      progress: 4,
      completed: false,
    };
    expect(parseWeeklyChallenge(value)).toEqual({
      code: 'daily-5',
      threshold: 5,
      gems: 20,
      progress: 4,
      completed: false,
    });
    expect(parseWeeklyChallenge({ ...value, code: 'from-the-future' })).toBeNull();
    expect(parseWeeklyChallenge(null)).toBeNull();
  });
});
