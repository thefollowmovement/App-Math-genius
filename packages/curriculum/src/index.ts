import { cinquiemeSkills } from './grades/cinquieme';
import { ce2Skills } from './grades/ce2';
import { cm1Skills } from './grades/cm1';
import { cm2Skills } from './grades/cm2';
import { sixiemeSkills } from './grades/sixieme';
import type { Skill } from './types';

export { DOMAINS, type Domain, type Skill, type SkillDefinition } from './types';

/** Skill referential, CE2 → 5e for now; CP, CE1, 4e and 3e come later. */
export const skills = [
  ...ce2Skills,
  ...cm1Skills,
  ...cm2Skills,
  ...sixiemeSkills,
  ...cinquiemeSkills,
] as const;

export type SkillCode = (typeof skills)[number]['code'];

const skillsByCode: ReadonlyMap<string, Skill> = new Map(
  skills.map((skill) => [skill.code, skill]),
);

export function isSkillCode(code: string): code is SkillCode {
  return skillsByCode.has(code);
}

export function getSkill(code: SkillCode): Skill {
  const skill = skillsByCode.get(code);
  if (!skill) throw new Error(`Unknown skill ${code}`);
  return skill;
}
