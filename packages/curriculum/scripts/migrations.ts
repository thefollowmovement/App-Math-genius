import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const MIGRATIONS_DIR = join(__dirname, '../../../supabase/migrations');

/** Most recent generated skills migration, or null before the first one. */
export function latestSkillsMigration(): { name: string; sql: string } | null {
  const name = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('_skills.sql'))
    .sort()
    .at(-1);
  return name ? { name, sql: readFileSync(join(MIGRATIONS_DIR, name), 'utf8') } : null;
}
