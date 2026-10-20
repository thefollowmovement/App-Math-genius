import type { Grade } from './grade';

/**
 * Age groups the coach writes for (docs/specs.md, Centres d'intérêt des CE1 → 3e): tone, words
 * and universes differ from one to the next; cached explanations are kept per group.
 */
export const GRADE_BANDS = ['cp-ce2', 'cm1-cm2', '6e-5e', '4e-3e'] as const;
export type GradeBand = (typeof GRADE_BANDS)[number];

const BANDS: Record<Grade, GradeBand> = {
  CP: 'cp-ce2',
  CE1: 'cp-ce2',
  CE2: 'cp-ce2',
  CM1: 'cm1-cm2',
  CM2: 'cm1-cm2',
  '6e': '6e-5e',
  '5e': '6e-5e',
  '4e': '4e-3e',
  '3e': '4e-3e',
};

export const gradeBand = (grade: Grade): GradeBand => BANDS[grade];
