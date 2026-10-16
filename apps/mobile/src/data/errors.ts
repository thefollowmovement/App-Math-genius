export type ErrorKind =
  | 'invalidCredentials'
  | 'emailTaken'
  | 'invalidPairingCode'
  | 'deviceInOtherFamily'
  | 'network'
  | 'unknown';

/** Maps Supabase auth, database and network errors to the cases the interface explains. */
export function errorKind(error: unknown): ErrorKind {
  const { message = '', code = '' } =
    typeof error === 'object' && error !== null
      ? (error as { message?: unknown; code?: unknown } & object)
      : {};
  const text = String(message);

  if (code === 'invalid_credentials' || /invalid login credentials/i.test(text)) {
    return 'invalidCredentials';
  }
  if (code === 'user_already_exists' || /already registered/i.test(text)) return 'emailTaken';
  if (text.includes('invalid_pairing_code')) return 'invalidPairingCode';
  if (text.includes('device_in_other_family')) return 'deviceInOtherFamily';
  if (/network request failed|failed to fetch|fetch failed/i.test(text)) return 'network';
  return 'unknown';
}
