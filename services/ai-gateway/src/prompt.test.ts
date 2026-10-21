import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { DEFAULT_PROMPT } from './prompt';

const MIGRATIONS = join(__dirname, '../../../supabase/migrations');

describe('the first prompt', () => {
  it('is the one the migration loads (ai_prompts version 1)', () => {
    const name = readdirSync(MIGRATIONS).find((file) => file.endsWith('_ai_coach.sql'));
    const sql = readFileSync(join(MIGRATIONS, name ?? ''), 'utf8');
    expect(sql).toContain(`$prompt$${DEFAULT_PROMPT.system}$prompt$`);
    expect(sql).toContain(`$prompt$${DEFAULT_PROMPT.user}$prompt$`);
  });
});
