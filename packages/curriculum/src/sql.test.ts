import { skills } from '.';
import { latestSkillsMigration } from '../scripts/migrations';
import { skillsSql } from './sql';

describe('skills migration', () => {
  it('loads every skill, quotes included', () => {
    const sql = skillsSql();
    for (const skill of skills) expect(sql).toContain(`('${skill.code}', '${skill.grade}'`);
    expect(sql.match(/^ {2}\('/gm)).toHaveLength(skills.length);
  });

  it('matches the referential (run `pnpm curriculum:sql` after changing it)', () => {
    expect(latestSkillsMigration()?.sql).toBe(skillsSql());
  });
});
