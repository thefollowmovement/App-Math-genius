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

  it('recognizes network failures and falls back to unknown', () => {
    expect(errorKind(new TypeError('Network request failed'))).toBe('network');
    expect(errorKind('boom')).toBe('unknown');
    expect(errorKind(undefined)).toBe('unknown');
  });
});
