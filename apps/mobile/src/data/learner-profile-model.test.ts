import { parseProfile, superPower } from './learner-profile-model';

describe('learning profile on the device', () => {
  const stored = {
    grade: 'CM2',
    answers: 400,
    mastered: 12,
    inProgress: 3,
    strengths: [
      { kind: 'mental_speed', medianMs: 2800, rate: 0.9 },
      { kind: 'superpower-of-the-future' },
      { kind: 'ahead', strand: 'fractions' },
    ],
    weaknesses: [
      { kind: 'error', error: 'area-perimeter', count: 5, lastSeenAt: '2026-10-19T17:00:00Z' },
      { kind: 'error', error: 'a-new-code', count: 9 },
      { kind: 'fading', skill: 'ce2.tables-multiplication', mastery: 70 },
    ],
    style: { attention: { kind: 'drops', after: 10 }, bestTime: 'noon', afterError: 'guesses' },
    computedAt: '2026-10-20T03:00:00Z',
  };

  it('reads what it knows and leaves out the rest', () => {
    const profile = parseProfile(stored);
    expect(profile?.strengths.map((item) => item.kind)).toEqual(['mental_speed', 'ahead']);
    expect(profile?.weaknesses).toEqual([
      { kind: 'error', error: 'area-perimeter', count: 5, lastSeenAt: '2026-10-19T17:00:00Z' },
      { kind: 'fading', skill: 'ce2.tables-multiplication', mastery: 70 },
    ]);
    expect(profile?.style).toEqual({
      attention: { kind: 'drops', after: 10 },
      bestTime: null,
      afterError: 'guesses',
      twinSuccess: null,
    });
    expect(parseProfile({ grade: 'Terminale' })).toBeNull();
  });

  it('turns the first strength into a super-power', () => {
    expect(superPower(parseProfile(stored))).toEqual({ kind: 'mental_speed' });
    const ahead = parseProfile({ ...stored, strengths: stored.strengths.slice(2) });
    expect(superPower(ahead)).toEqual({ kind: 'strand', strand: 'fractions', how: 'ahead' });
    expect(superPower(parseProfile({ ...stored, strengths: [] }))).toBeNull();
    expect(superPower(null)).toBeNull();
  });
});
