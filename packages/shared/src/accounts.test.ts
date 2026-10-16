import { childProfileSchema, parentSignUpSchema } from './accounts';

describe('parentSignUpSchema', () => {
  const valid = {
    displayName: ' Camille ',
    email: 'camille@example.com',
    password: 'motdepasse',
    acceptsPrivacyPolicy: true,
  };

  it('accepts a complete sign-up and trims the name', () => {
    expect(parentSignUpSchema.parse(valid).displayName).toBe('Camille');
  });

  it('requires explicit consent to the privacy policy', () => {
    expect(parentSignUpSchema.safeParse({ ...valid, acceptsPrivacyPolicy: false }).success).toBe(
      false,
    );
  });

  it('rejects short passwords and invalid emails', () => {
    expect(parentSignUpSchema.safeParse({ ...valid, password: 'court' }).success).toBe(false);
    expect(parentSignUpSchema.safeParse({ ...valid, email: 'camille' }).success).toBe(false);
  });
});

describe('childProfileSchema', () => {
  const valid = { displayName: 'Léa', gender: 'girl', grade: 'CE2', birthYear: null };

  it('accepts a nickname, a gender and a grade, birth year optional', () => {
    expect(childProfileSchema.parse(valid)).toEqual(valid);
    expect(childProfileSchema.parse({ ...valid, birthYear: 2017 }).birthYear).toBe(2017);
  });

  it('rejects empty or too long names', () => {
    expect(childProfileSchema.safeParse({ ...valid, displayName: '   ' }).success).toBe(false);
    expect(childProfileSchema.safeParse({ ...valid, displayName: 'x'.repeat(31) }).success).toBe(
      false,
    );
  });
});
