import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { generators } from '.';

// Every migration, in order: a function's last definition is the one the database runs.
const migrations = join(__dirname, '../../../../supabase/migrations');
const sql = readdirSync(migrations)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => readFileSync(join(migrations, name), 'utf8'))
  .join('\n');

describe('skills with exercises', () => {
  it('are the ones the database measures the programme on', () => {
    // private.skills_with_exercises (*_statistics.sql): replace it in a new migration when a
    // generator adds a skill.
    const [, list = ''] =
      [
        ...sql.matchAll(
          /create (?:or replace )?function private\.skills_with_exercises\(\)[\s\S]*?array\[([^\]]*)\]/g,
        ),
      ].at(-1) ?? [];
    const stored = [...list.matchAll(/'([^']+)'/g)].map(([, code]) => code);
    expect(stored).toEqual([...new Set(generators.map((generator) => generator.skill))].sort());
  });
});
