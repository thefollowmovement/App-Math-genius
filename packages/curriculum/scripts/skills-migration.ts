import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { MIGRATIONS_DIR, latestSkillsMigration } from './migrations';
import { skillsSql } from '../src/sql';

// Writes a new migration when the referential differs from the last one loaded in the database.
const sql = skillsSql();
const latest = latestSkillsMigration();

if (latest?.sql === sql) {
  console.log(`Referential already loaded by ${latest.name}.`);
} else {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const name = `${stamp}_skills.sql`;
  writeFileSync(join(MIGRATIONS_DIR, name), sql);
  console.log(`Wrote supabase/migrations/${name}.`);
}
