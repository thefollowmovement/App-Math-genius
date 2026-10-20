import type { Grade } from '@math-genius/shared';

/** The four columns of the programme table in docs/specs.md. */
export const DOMAINS = ['numbers', 'measures', 'geometry', 'data'] as const;
export type Domain = (typeof DOMAINS)[number];

/**
 * The key areas of the placement test (docs/specs.md, Test de positionnement): finer than the
 * domains, so that a child strong in calculation but weak in fractions is placed in each.
 * Algebra goes with calculation, data and probabilities with problems.
 */
export const STRANDS = [
  'numeration',
  'calcul',
  'fractions',
  'mesures',
  'geometrie',
  'problemes',
] as const;
export type Strand = (typeof STRANDS)[number];

export type SkillDefinition = {
  /** Stable identifier `<grade>.<slug>`, stored with every child's mastery: never rename it. */
  code: string;
  domain: Domain;
  /** Area of the placement test the skill belongs to. */
  strand: Strand;
  /** French title, as a teacher would phrase the expected skill. */
  title: string;
  /** Codes of the skills to master first (same or earlier grade). */
  prerequisites: readonly string[];
  /** Mental calculation to make automatic: practised in timed rounds in every session. */
  automatism?: boolean;
};

export type Skill = SkillDefinition & {
  subject: 'math';
  grade: Grade;
  /** School year from which the programme behind this skill applies (see docs/specs.md). */
  programVersion: string;
};

/** Adds the grade-wide fields while keeping each code as a literal type. */
export function defineGradeSkills<const T extends readonly SkillDefinition[]>(
  grade: Grade,
  programVersion: string,
  skills: T,
): { [K in keyof T]: T[K] & Skill } {
  return skills.map((skill) => ({ ...skill, subject: 'math', grade, programVersion })) as {
    [K in keyof T]: T[K] & Skill;
  };
}
