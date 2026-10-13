import {
  PAIRING_CODE_ALPHABET,
  normalizePairingCode,
  pairingCodeSchema,
  pairingLink,
  parsePairingPayload,
} from './pairing';

describe('pairing codes', () => {
  it('uses 32 characters without look-alikes', () => {
    expect(PAIRING_CODE_ALPHABET).toHaveLength(32);
    expect(PAIRING_CODE_ALPHABET).not.toMatch(/[IO01]/);
  });

  it('normalizes what a child types', () => {
    expect(normalizePairingCode(' abc-234 ')).toBe('ABC234');
    expect(pairingCodeSchema.parse('abc 234')).toBe('ABC234');
  });

  it('rejects codes with look-alikes or the wrong length', () => {
    expect(pairingCodeSchema.safeParse('ABC1O4').success).toBe(false);
    expect(pairingCodeSchema.safeParse('ABC23').success).toBe(false);
  });

  it('reads the code from a scanned pairing link or from typed text', () => {
    expect(parsePairingPayload(pairingLink('XYZ789'))).toBe('XYZ789');
    expect(parsePairingPayload('xyz789')).toBe('XYZ789');
    expect(parsePairingPayload('https://example.com')).toBeNull();
  });
});
