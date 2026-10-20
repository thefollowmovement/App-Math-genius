import { errorKind } from './errors';

describe('errorKind', () => {
  it('recognizes auth errors by code or message', () => {
    expect(errorKind({ code: 'invalid_credentials', message: 'x' })).toBe('invalidCredentials');
    expect(errorKind(new Error('Invalid login credentials'))).toBe('invalidCredentials');
    expect(errorKind({ code: 'user_already_exists', message: 'x' })).toBe('emailTaken');
  });

  it('recognizes pairing errors raised by the database', () => {
    expect(errorKind({ code: 'P0002', message: 'invalid_pairing_code' })).toBe(
      'invalidPairingCode',
    );
    expect(errorKind({ code: '42501', message: 'device_in_other_family' })).toBe(
      'deviceInOtherFamily',
    );
  });

  it('recognizes a parent sending messages too fast', () => {
    expect(errorKind({ code: 'PT429', message: 'too_many_messages' })).toBe('tooManyMessages');
  });

  it('recognizes purchases the shop refuses', () => {
    expect(errorKind({ code: 'PT409', message: 'not_enough_gems' })).toBe('notEnoughGems');
    expect(errorKind({ code: 'PT409', message: 'already_owned' })).toBe('alreadyOwned');
    expect(errorKind({ code: 'PT409', message: 'too_many_freezes' })).toBe('tooManyFreezes');
    expect(errorKind({ code: 'PT403', message: 'avatar_locked' })).toBe('avatarLocked');
    expect(errorKind({ code: 'PT409', message: 'personalization_off' })).toBe('personalizationOff');
  });

  it('recognizes network failures and falls back to unknown', () => {
    expect(errorKind(new TypeError('Network request failed'))).toBe('network');
    expect(errorKind('boom')).toBe('unknown');
    expect(errorKind(undefined)).toBe('unknown');
  });
});
