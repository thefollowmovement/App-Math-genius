import { award } from '@/test-utils/rewards';

import { awardState, awardsFromResponse, parseOpenedChest, progressView } from './rewards-model';

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
