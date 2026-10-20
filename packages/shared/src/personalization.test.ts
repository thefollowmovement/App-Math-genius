import { universeDue } from './personalization';

describe('« Ton univers » is asked', () => {
  const now = new Date(2026, 10, 20, 17);

  it('the first time, 3 months later and at each school year', () => {
    expect(universeDue(null, now)).toBe(true);
    expect(universeDue(new Date(2026, 9, 1).toISOString(), now)).toBe(false);
    expect(universeDue(new Date(2026, 7, 20).toISOString(), now)).toBe(true);
    expect(universeDue(new Date(2026, 8, 2).toISOString(), new Date(2026, 11, 2))).toBe(true);
    expect(universeDue(new Date(2026, 8, 2).toISOString(), new Date(2026, 11, 1))).toBe(false);
  });
});
