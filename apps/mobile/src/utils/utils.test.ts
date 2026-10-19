import { plausibleBirthYears } from './birth-years';
import { invalidFields } from './invalid-fields';

describe('plausibleBirthYears', () => {
  it('covers ages 5 to 16, most recent first', () => {
    const years = plausibleBirthYears(2026);
    expect(years[0]).toBe(2021);
    expect(years.at(-1)).toBe(2010);
  });
});

describe('invalidFields', () => {
  it('collects the top-level field of each issue', () => {
    expect(invalidFields([{ path: ['email'] }, { path: ['password', 0] }])).toEqual(
      new Set(['email', 'password']),
    );
  });
});
