import { ERROR_TYPES, getErrorType, isErrorTypeCode, isSkillCode } from '.';

describe('typical mistakes', () => {
  it('has unique, well-formed codes', () => {
    const codes = ERROR_TYPES.map((type) => type.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(code).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('describes each mistake in a short sentence about the child', () => {
    const labels = ERROR_TYPES.map((type) => type.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const label of labels) {
      expect(label.trim()).toBe(label);
      expect(label.length).toBeGreaterThan(5);
      expect(label.length).toBeLessThanOrEqual(90);
      // Lower case, as it follows the child's name or « Il / Elle ».
      expect(label[0]).toBe(label[0]?.toLowerCase());
    }
  });

  it('only names existing skills, once each', () => {
    for (const type of ERROR_TYPES) {
      expect(type.skills.length).toBeGreaterThan(0);
      expect(new Set(type.skills).size).toBe(type.skills.length);
      for (const skill of type.skills) expect(isSkillCode(skill)).toBe(true);
    }
  });

  it('looks a mistake up by its code', () => {
    expect(isErrorTypeCode('forgot-carry')).toBe(true);
    expect(isErrorTypeCode('unknown')).toBe(false);
    expect(getErrorType('forgot-carry').label).toBe('oublie la retenue');
  });
});
