import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { GAME_DAILY_GEMS, MINI_GAME_IDS, gameGems, isMiniGameId } from './games';

const migrations = join(__dirname, '../../../supabase/migrations');
const file = readdirSync(migrations).find((name) => name.endsWith('_mini_games.sql'));
const sql = readFileSync(join(migrations, file ?? ''), 'utf8');

describe('mini-games', () => {
  it('match the catalog of the migration, in the same order', () => {
    const [, values = ''] =
      /insert into public\.mini_games \(id, position\) values([^;]*);/.exec(sql) ?? [];
    const rows = [...values.matchAll(/\('([a-z0-9-]+)', (\d+)\)/g)].map(([, id, position]) => ({
      id,
      position: Number(position),
    }));
    expect(rows).toEqual(MINI_GAME_IDS.map((id, index) => ({ id, position: index + 1 })));
    expect(isMiniGameId('vol-du-chaton')).toBe(true);
    expect(isMiniGameId('tetris')).toBe(false);
  });

  it('earn a gem every 3 right answers, 20 a day at most', () => {
    // Same case as supabase/tests/database/games.test.sql.
    let today = 0;
    const earned = [4, 30, 30, 9].map((right) => {
      const gems = gameGems(right, today);
      today += gems;
      return gems;
    });
    expect(earned).toEqual([1, 10, 9, 0]);
    expect(today).toBe(GAME_DAILY_GEMS);
    expect(sql).toContain(`daily_cap constant integer := ${GAME_DAILY_GEMS};`);
  });
});
