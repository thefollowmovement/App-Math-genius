import { z } from 'zod';

/** Pairing code characters, without look-alikes (no I, O, 0, 1). Matches the database check. */
export const PAIRING_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const PAIRING_CODE_LENGTH = 6;

/** Deep link encoded in the pairing QR code: the app's scheme (app.json) and pairing route. */
export const PAIRING_LINK_PREFIX = 'mathgenius://child/pair?code=';

const PAIRING_CODE_PATTERN = new RegExp(`^[${PAIRING_CODE_ALPHABET}]{${PAIRING_CODE_LENGTH}}$`);

/** Uppercases and drops spaces and dashes, so "abc 234" and "ABC-234" both work. */
export function normalizePairingCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '');
}

export const pairingCodeSchema = z
  .string()
  .transform(normalizePairingCode)
  .pipe(z.string().regex(PAIRING_CODE_PATTERN));

export function pairingLink(code: string): string {
  return `${PAIRING_LINK_PREFIX}${code}`;
}

/** Reads a code from a scanned QR payload (pairing link) or typed text; null when invalid. */
export function parsePairingPayload(payload: string): string | null {
  const fromLink = /[?&]code=([^&#]+)/.exec(payload)?.[1];
  const result = pairingCodeSchema.safeParse(fromLink ?? payload);
  return result.success ? result.data : null;
}
