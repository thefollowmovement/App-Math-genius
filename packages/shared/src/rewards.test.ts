import { levelForXp, levelProgress, xpForLevel } from './rewards';

describe('levels', () => {
  it('follow the thresholds also used by the database', () => {
    // Same case as rewards.test.sql.
    expect([0, 99, 100, 299, 300, 999, 1000, 4500].map(levelForXp)).toEqual([
      1, 1, 2, 2, 3, 4, 5, 10,
    ]);
    expect(xpForLevel(1)).toBe(0);
  });

  it('measure the way to the next level', () => {
    expect(levelProgress(350)).toEqual({ level: 3, inLevel: 50, toNext: 300 });
  });
});
