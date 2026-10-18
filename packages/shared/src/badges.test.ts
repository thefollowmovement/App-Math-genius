import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { BADGES, BADGE_METRICS, badgeProgress, isBadgeCode } from './badges';

// The catalog and the measures as the migration writes them.
const migrations = join(__dirname, '../../../supabase/migrations');
const file = readdirSync(migrations).find((name) => name.endsWith('_badges.sql'));
const sql = readFileSync(join(migrations, file ?? ''), 'utf8');

describe('badges', () => {
  it('match the catalog of the migration, in the same order', () => {
    const rows = [...sql.matchAll(/\('([a-z0-9-]+)', '(\w+)', '(\w+)', (\d+), (\d+)\)/g)].map(
      ([, code, category, metric, threshold, position]) => ({
        code,
        category,
        metric,
        threshold: Number(threshold),
        position: Number(position),
      }),
    );
    expect(rows).toEqual(BADGES.map((badge, index) => ({ ...badge, position: index + 1 })));
  });

  it('only ask for measures the server computes', () => {
    // Keys of the object built by private.badge_metrics: one per line.
    const measured = [...sql.matchAll(/^\s+'(\w+)',\s/gm)].map(([, key]) => key);
    expect(measured).toEqual(expect.arrayContaining([...BADGE_METRICS]));
  });

  it('have unique codes', () => {
    expect(new Set(BADGES.map((badge) => badge.code)).size).toBe(BADGES.length);
    expect(isBadgeCode('streak-7')).toBe(true);
    expect(isBadgeCode('streak-8')).toBe(false);
  });

  it('show their progress, capped at the threshold', () => {
    const week = BADGES.find((badge) => badge.code === 'streak-7');
    if (!week) throw new Error('streak-7 is missing');
    expect(badgeProgress(week, { streak_best: 3 })).toEqual({
      value: 3,
      threshold: 7,
      done: false,
    });
    expect(badgeProgress(week, { streak_best: 12 })).toEqual({
      value: 7,
      threshold: 7,
      done: true,
    });
    expect(badgeProgress(week, {})).toEqual({ value: 0, threshold: 7, done: false });
  });
});
