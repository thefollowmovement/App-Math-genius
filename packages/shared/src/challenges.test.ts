import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CHALLENGES, challengeOfWeek, isChallengeCode, weekStart } from './challenges';

const migrations = join(__dirname, '../../../supabase/migrations');
const file = readdirSync(migrations).find((name) => name.endsWith('_challenges.sql'));
const sql = readFileSync(join(migrations, file ?? ''), 'utf8');

describe('weekly challenges', () => {
  it('match the catalog of the migration, in rotation order', () => {
    const values =
      /insert into public\.challenges \(code, metric, threshold, gems, position\) values([^;]*);/.exec(
        sql,
      )?.[1] ?? '';
    const rows = [...values.matchAll(/\('([a-z0-9-]+)', '(\w+)', (\d+), (\d+), (\d+)\)/g)].map(
      ([, code, metric, threshold, gems, position]) => ({
        code,
        metric,
        threshold: Number(threshold),
        gems: Number(gems),
        position: Number(position),
      }),
    );
    expect(rows).toEqual(
      CHALLENGES.map((challenge, index) => ({ ...challenge, position: index + 1 })),
    );
  });

  it('start on Mondays', () => {
    expect(weekStart('2026-10-18')).toBe('2026-10-12');
    expect(weekStart('2026-10-12')).toBe('2026-10-12');
    expect(weekStart('2026-01-01')).toBe('2025-12-29');
  });

  // The same case as supabase/tests/database/challenges.test.sql.
  it('take turns every week', () => {
    expect(challengeOfWeek('2026-01-05').code).toBe('daily-5');
    expect(challengeOfWeek('2026-01-12').code).toBe('correct-150');
    expect(challengeOfWeek('2026-09-17').code).toBe('daily-5');
    expect(challengeOfWeek('2026-10-14').code).toBe('perfect-1');
    expect(challengeOfWeek('2026-10-18').code).toBe('perfect-1');
    expect(challengeOfWeek('2026-10-19').code).toBe('minutes-60');
    expect(challengeOfWeek('2025-12-31').code).toBe('minutes-60');
    expect(isChallengeCode('combo-10')).toBe(true);
  });
});
