import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SHOP_ITEMS, isShopItemCode } from './shop';

// The catalog as the migrations write it, in order.
const migrations = join(__dirname, '../../../supabase/migrations');
const sql = readdirSync(migrations)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => readFileSync(join(migrations, name), 'utf8'))
  .join('\n');
const catalog = [
  ...sql.matchAll(
    /insert into public\.shop_items \(code, kind, price_gems, position\) values([^;]*);/g,
  ),
]
  .map(([, values]) => values)
  .join('\n');

describe('shop items', () => {
  it('match the catalog of the migrations, in the same order', () => {
    const rows = [...catalog.matchAll(/\('([a-z0-9-]+)', '(\w+)', (\d+), (\d+)\)/g)].map(
      ([, code, kind, price, position]) => ({
        code,
        kind,
        price: Number(price),
        position: Number(position),
      }),
    );
    expect(rows).toEqual(SHOP_ITEMS.map((item, index) => ({ ...item, position: index + 1 })));
  });

  it('have unique codes', () => {
    expect(new Set(SHOP_ITEMS.map((item) => item.code)).size).toBe(SHOP_ITEMS.length);
    expect(isShopItemCode('kitten')).toBe(true);
    expect(isShopItemCode('spaceship')).toBe(false);
  });
});
