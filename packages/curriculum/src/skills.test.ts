import { gradeRank as gradeIndex, type Grade } from '@math-genius/shared';

import { DOMAINS, STRANDS, type Domain, type Strand, getSkill, isSkillCode, skills } from '.';

const codePrefix: Partial<Record<Grade, string>> = {
  CE2: 'ce2.',
  CM1: 'cm1.',
  CM2: 'cm2.',
  '6e': '6e.',
  '5e': '5e.',
};

describe('skill referential', () => {
  it('has unique, well-formed codes prefixed by their grade', () => {
    const codes = skills.map((skill) => skill.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const skill of skills) {
      expect(skill.code).toMatch(/^[a-z0-9]+\.[a-z0-9-]+$/);
      expect(skill.code.startsWith(codePrefix[skill.grade] ?? '?')).toBe(true);
    }
  });

  it('has unique, non-empty titles', () => {
    const titles = skills.map((skill) => skill.title.trim());
    expect(titles.every((title) => title.length > 0)).toBe(true);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('only requires existing skills from the same or an earlier grade', () => {
    for (const skill of skills) {
      for (const prerequisite of skill.prerequisites) {
        expect(isSkillCode(prerequisite)).toBe(true);
        expect(prerequisite).not.toBe(skill.code);
        if (isSkillCode(prerequisite)) {
          expect(gradeIndex(getSkill(prerequisite).grade)).toBeLessThanOrEqual(
            gradeIndex(skill.grade),
          );
        }
      }
    }
  });

  it('has no prerequisite cycle', () => {
    const state = new Map<string, 'visiting' | 'done'>();
    const visit = (code: string, path: string[]): void => {
      if (state.get(code) === 'done') return;
      if (state.get(code) === 'visiting') throw new Error(`Cycle: ${[...path, code].join(' → ')}`);
      state.set(code, 'visiting');
      const skill = skills.find((candidate) => candidate.code === code);
      for (const prerequisite of skill?.prerequisites ?? []) visit(prerequisite, [...path, code]);
      state.set(code, 'done');
    };
    expect(() => skills.forEach((skill) => visit(skill.code, []))).not.toThrow();
  });

  it.each(['CE2', 'CM1', 'CM2', '6e', '5e'] as const)(
    'covers the four domains with at least 24 skills in %s',
    (grade) => {
      const gradeSkills = skills.filter((skill) => skill.grade === grade);
      expect(gradeSkills.length).toBeGreaterThanOrEqual(24);
      expect(new Set(gradeSkills.map((skill) => skill.domain))).toEqual(new Set(DOMAINS));
    },
  );

  it('only marks calculation skills as automatisms, from CE2 on', () => {
    const automatisms = skills.filter((skill) => 'automatism' in skill && skill.automatism);
    expect(automatisms.map((skill) => skill.grade)).toContain('CE2');
    expect(automatisms.every((skill) => skill.domain === 'numbers')).toBe(true);
    expect(automatisms.every((skill) => skill.strand === 'calcul')).toBe(true);
  });

  it('places each skill in a strand of the placement test that fits its domain', () => {
    const fits: Record<Domain, readonly Strand[]> = {
      // Word problems sit with numbers in the programme.
      numbers: ['numeration', 'calcul', 'fractions', 'problemes'],
      measures: ['mesures'],
      geometry: ['geometrie'],
      // Algebra is calculation; data, proportionality and probabilities are problems.
      data: ['problemes', 'calcul'],
    };
    for (const skill of skills) expect(fits[skill.domain]).toContain(skill.strand);
    expect(new Set(skills.map((skill) => skill.strand))).toEqual(new Set(STRANDS));
  });
});
