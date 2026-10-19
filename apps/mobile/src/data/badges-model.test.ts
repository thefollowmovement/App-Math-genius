import { BADGES } from '@math-genius/shared';

import { BADGE_COUNT, badgeGroups, knownBadges, parseMetrics } from './badges-model';

describe('badgeGroups', () => {
  const groups = badgeGroups({
    earned: [{ badge_code: 'streak-3', earned_at: '2026-10-07T16:00:00Z' }],
    metrics: { streak_best: 4, mastered_skills: 30 },
  });
  const all = groups.flatMap((group) => group.badges);
  const byCode = (code: string) => all.find((badge) => badge.code === code);

  it('lists every badge once, by category', () => {
    expect(groups.map((group) => group.category)).toEqual([
      'regularity',
      'mastery',
      'discovery',
      'progression',
    ]);
    expect(all.map((badge) => badge.code).sort()).toEqual(BADGES.map((badge) => badge.code).sort());
    expect(BADGE_COUNT).toBe(43);
  });

  it('puts earned badges first', () => {
    expect(groups[0]?.badges.slice(0, 2).map((badge) => badge.code)).toEqual([
      'streak-3',
      'streak-7',
    ]);
    const regularity = badgeGroups({
      earned: [{ badge_code: 'weekend', earned_at: '2026-10-10T16:00:00Z' }],
      metrics: {},
    })[0];
    expect(regularity?.badges[0]?.code).toBe('weekend');
  });

  it('marks earned badges and shows how far the child is from the others', () => {
    expect(byCode('streak-3')).toMatchObject({ earnedAt: '2026-10-07T16:00:00Z', value: 3 });
    expect(byCode('streak-7')).toMatchObject({ earnedAt: null, value: 4, threshold: 7 });
    expect(byCode('sessions-1')).toMatchObject({ earnedAt: null, value: 0 });
    // Reached but not granted yet (the next award grants it): capped, still to earn.
    expect(byCode('mastery-25')).toMatchObject({ earnedAt: null, value: 25 });
  });
});

describe('parseMetrics', () => {
  it('keeps the known measures only', () => {
    expect(parseMetrics({ streak_best: 4, level: 2, unknown: 3, rare_chests: 'x' })).toEqual({
      streak_best: 4,
      level: 2,
    });
    expect(parseMetrics(null)).toEqual({});
  });
});

describe('knownBadges', () => {
  it('leaves out badges this version of the app does not know', () => {
    expect(knownBadges(['streak-7', 'from-the-future', 'tables'])).toEqual(['streak-7', 'tables']);
  });
});
