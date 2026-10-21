import {
  readAdvice,
  readHighlights,
  readProgress,
  readRecap,
  readVerdict,
  successRate,
  verdictReason,
} from './progress';
import {
  HIGHLIGHTS_SAMPLE,
  MONTHLY_RECAP_SAMPLE,
  PROGRESS_SAMPLE,
  WEEKLY_RECAP_SAMPLE,
} from './testing/progress-samples';

describe('the statistics the database computes', () => {
  it('reads the « Progrès » page', () => {
    const progress = readProgress(PROGRESS_SAMPLE);
    expect(progress?.today).toBe('2026-09-30');
    expect(progress?.calendar.days).toHaveLength(30);
    expect(progress?.calendar.days[8]).toEqual({
      date: '2026-09-09',
      plan: 'planned',
      status: 'started',
      minutes: 5,
    });
    expect(progress?.verdict).toMatchObject({ level: 'watch', planned: 5, done: 3, success: 0.8 });
    expect(progress?.series.days).toHaveLength(30);
    expect(progress?.series.weeks.map((week) => week.date)[0]).toBe('2026-08-31');
    expect(progress?.domains.map((domain) => [domain.domain, domain.value])).toEqual([
      ['numbers', 54],
      ['measures', 31],
      ['data', 82],
    ]);
    expect(progress?.skills.filter((skill) => skill.list === 'mastered')).toHaveLength(2);
    expect(progress?.blocking[0]).toMatchObject({
      skill: 'cm1.comparer-decimaux',
      errors: 17,
      errorType: 'decimals-as-integers',
      example: { generatorId: 'cm1.comparer-decimaux', difficulty: 2, seed: 1002 },
    });
    expect(progress?.programme).toMatchObject({ grade: 'CM1', expected: 1, position: 'on_track' });
  });

  it('reads a week and a month', () => {
    const week = readRecap(WEEKLY_RECAP_SAMPLE);
    expect(week).toMatchObject({ kind: 'weekly', planned: 5, done: 4, streak: 4, minutes: 60 });
    expect(week?.kind === 'weekly' && week.toWork).toMatchObject({
      skill: 'cm1.comparer-decimaux',
    });
    const month = readRecap(MONTHLY_RECAP_SAMPLE);
    expect(month).toMatchObject({
      kind: 'monthly',
      planned: 17,
      done: 13,
      offDays: 8,
      vacationDays: 5,
      badges: ['sessions-1', 'streak-3'],
      rewards: ['Une sortie au cinéma'],
    });
    expect(month?.kind === 'monthly' && month.skippedDates[0]).toEqual({
      date: '2026-09-09',
      started: true,
    });
    expect(month?.kind === 'monthly' && month.domains[0]).toEqual({
      domain: 'numbers',
      start: 8,
      end: 54,
      mastered: 1,
      total: 4,
    });
  });

  it("reads the child's card", () => {
    expect(readHighlights(HIGHLIGHTS_SAMPLE)).toEqual({
      kind: 'month',
      from: '2026-09-01',
      to: '2026-09-30',
      days: 15,
      correct: 122,
      xp: 1050,
      learned: 2,
      badges: 2,
    });
    expect(readHighlights(null)).toBeNull();
  });

  it('leaves out what it does not know, and reads damaged answers as null', () => {
    expect(readProgress({ today: 'yesterday' })).toBeNull();
    expect(
      readRecap({
        kind: 'yearly',
        child: { id: 'x', grade: 'CM1' },
        from: '2026-01-01',
        to: '2026-12-31',
      }),
    ).toBeNull();
    expect(readAdvice({ source: 'ai', tips: [] })).toBeNull();
    expect(readAdvice({ source: 'standard', tips: ['Un conseil', 3] })).toEqual({
      source: 'standard',
      tips: ['Un conseil'],
    });
    expect(readVerdict(null)).toMatchObject({ level: 'none', regularity: null, success: null });
  });

  it('says why the verdict is what it is', () => {
    const verdict = readVerdict({ level: 'watch', planned: 5, done: 3, active: 4 });
    expect(verdictReason(verdict)).toBe('good');
    expect(verdictReason({ ...verdict, irregular: true })).toBe('irregular');
    expect(verdictReason({ ...verdict, irregular: true, struggling: true })).toBe('both');
    expect(verdictReason({ ...verdict, active: 0, level: 'alert' })).toBe('inactive');
    expect(verdictReason({ ...verdict, level: 'none' })).toBe('none');
    expect(successRate(9, 9)).toBeNull();
    expect(successRate(40, 32)).toBe(0.8);
  });
});
