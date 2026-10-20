import {
  type ErrorTypeCode,
  type SkillCode,
  isErrorTypeCode,
  isSkillCode,
} from '@math-genius/curriculum';
import { GRADE_BANDS, type Grade, type GradeBand } from '@math-genius/shared';

import type { CacheKey, NightJob } from './gateway';
import type { Universe } from './prompt';

/**
 * What the night writes first (docs/specs.md, cache et pré-génération de nuit): the mistakes
 * children made most in the last weeks, in each age group, with everyday examples first (for the
 * children without a universe), then the universes chosen most.
 */

export const keyString = (key: CacheKey) =>
  [key.skill, key.error ?? '', key.universe ?? '', key.band].join('|');

/** The grade the prompt names for an age group. */
const BAND_GRADE: Record<GradeBand, Grade> = {
  'cp-ce2': 'CE2',
  'cm1-cm2': 'CM1',
  '6e-5e': '6e',
  '4e-3e': '4e',
};

export type Occurrence = { band: string; skill: string; error: string | null; count: number };
export type UniverseCount = { band: string; universe: Universe; count: number };

const isBand = (band: string): band is GradeBand => GRADE_BANDS.some((item) => item === band);

export function nightJobs(input: {
  occurrences: readonly Occurrence[];
  universes: readonly UniverseCount[];
  /** keyString of the explanations already kept (pending or approved). */
  existing: ReadonlySet<string>;
  limit: number;
}): NightJob[] {
  const jobs: (NightJob & { score: number })[] = [];
  for (const occurrence of input.occurrences) {
    const { band, skill, error } = occurrence;
    if (!isBand(band) || !isSkillCode(skill) || (error !== null && !isErrorTypeCode(error)))
      continue;
    const mistake: ErrorTypeCode | null = error;
    const code: SkillCode = skill;
    const universes = input.universes
      .filter((item) => item.band === band)
      .sort((a, b) => b.count - a.count);
    const options: { universe: Universe | null; weight: number }[] = [
      // Everyday life serves every child of the group.
      { universe: null, weight: Math.max(1, ...universes.map((item) => item.count)) + 1 },
      ...universes.map((item) => ({ universe: item.universe, weight: item.count })),
    ];
    for (const { universe, weight } of options) {
      const key: CacheKey = { skill: code, error: mistake, universe: universe?.id ?? null, band };
      if (input.existing.has(keyString(key))) continue;
      jobs.push({ key, universe, grade: BAND_GRADE[band], score: occurrence.count * weight });
    }
  }
  return jobs
    .sort((a, b) => b.score - a.score || keyString(a.key).localeCompare(keyString(b.key)))
    .slice(0, input.limit)
    .map(({ key, universe, grade }) => ({ key, universe, grade }));
}
