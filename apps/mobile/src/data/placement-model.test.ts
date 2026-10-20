import type { ChildPractice, StoredSession } from './practice/practice-store';
import { placementOffer } from './placement-model';

const now = new Date(2026, 9, 20, 17);
const today = '2026-10-20';
const practice = (overrides: Partial<ChildPractice> = {}): ChildPractice => ({
  mastery: {},
  active: null,
  outbox: [],
  lastDailyDate: null,
  lastCompleted: null,
  placedAt: null,
  ...overrides,
});
const session = (kind: StoredSession['kind'], answers: number, localDate = today) =>
  ({ kind, localDate, attempts: Array.from({ length: answers }) }) as unknown as StoredSession;

describe('placementOffer', () => {
  it('offers the first test, then a recheck once due', () => {
    expect(placementOffer(undefined, 'CM1', today, now)).toBe('first');
    expect(placementOffer(practice({ placedAt: '2026-10-01T17:00:00Z' }), 'CM1', today, now)).toBe(
      null,
    );
    expect(placementOffer(practice({ placedAt: '2026-07-01T17:00:00Z' }), 'CM1', today, now)).toBe(
      'recheck',
    );
  });

  it('resumes a test under way, and waits behind another session under way', () => {
    expect(placementOffer(practice({ active: session('placement', 3) }), 'CM1', today, now)).toBe(
      'resume',
    );
    expect(placementOffer(practice({ active: session('daily', 4) }), 'CM1', today, now)).toBe(null);
    // Opened but not started, or left yesterday: the test can start.
    expect(placementOffer(practice({ active: session('daily', 0) }), 'CM1', today, now)).toBe(
      'first',
    );
    expect(
      placementOffer(practice({ active: session('daily', 5, '2026-10-19') }), 'CM1', today, now),
    ).toBe('first');
  });

  it('offers nothing to a grade without exercises yet', () => {
    expect(placementOffer(undefined, 'CP', today, now)).toBeNull();
  });
});
