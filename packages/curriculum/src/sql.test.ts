import { ERROR_TYPES, skills } from '.';
import { latestSkillsMigration } from '../scripts/migrations';
import { skillsSql } from './sql';

describe('skills migration', () => {
  it('loads every skill, quotes included', () => {
    const sql = skillsSql();
    for (const skill of skills) expect(sql).toContain(`('${skill.code}', '${skill.grade}'`);
    expect(sql.match(/^ {2}\('/gm)).toHaveLength(skills.length + ERROR_TYPES.length);
  });

  it('loads every typical mistake with its skills', () => {
    const sql = skillsSql();
    expect(sql).toContain(
      "('forgot-carry', 'oublie la retenue', array['ce2.addition-posee', 'ce2.multiplication-posee']::text[])",
    );
    expect(sql).toContain("('misaligned-commas', 'n’aligne pas les virgules', array[");
  });

  it('matches the referential (run `pnpm curriculum:sql` after changing it)', () => {
    expect(latestSkillsMigration()?.sql).toBe(skillsSql());
  });
});
