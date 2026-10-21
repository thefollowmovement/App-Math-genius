import { strings } from '@/i18n/fr';

import { errorText } from './errors';

describe('error messages', () => {
  it('names the errors the database raises', () => {
    expect(errorText({ message: 'own_role', code: 'PT409' })).toBe(strings.errors.own_role);
    expect(errorText({ message: 'duplicate key', code: '23505' })).toBe(strings.errors.duplicate);
    expect(errorText({ message: 'violates check constraint', code: '23514' })).toBe(
      strings.errors.check,
    );
    expect(errorText(new TypeError('Failed to fetch'))).toBe(strings.errors.network);
    expect(errorText(null)).toBe(strings.errors.unknown);
  });
});
