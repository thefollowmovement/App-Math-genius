import { DEFAULT_ROUTINE } from '@math-genius/shared';

import { strings } from '@/i18n';

import { dayText, daysText, nextDays, routineLines, timeSlots, timeText } from './routine-text';

const t = strings.routine;

describe('routine texts', () => {
  it('offers times every quarter of an hour', () => {
    expect(timeSlots('06:00', '07:00')).toEqual(['06:00', '06:15', '06:30', '06:45', '07:00']);
    expect(timeText(20 * 60 + 5)).toBe('20:05');
  });

  it('names the days of the routine', () => {
    expect(daysText([5, 1, 3])).toBe('lundi, mercredi, vendredi');
    expect(daysText([1, 2, 3, 4, 5, 6, 7])).toBe(t.everyDay);
  });

  it('sums the routine up in a few lines', () => {
    expect(routineLines({ ...DEFAULT_ROUTINE, weekendStartTime: '10:30' })).toEqual([
      t.daysLine('lundi, mardi, mercredi, jeudi, vendredi'),
      t.startLine('17:00', [t.weekendAt('10:30')]),
      t.deadlineLine('20:30'),
      t.goalLine(t.goals.duration(15)),
    ]);
  });

  it('lists calendar days across months and clock changes', () => {
    // Clocks go back in France on 25 October 2026.
    expect(nextDays('2026-10-24', 3)).toEqual(['2026-10-24', '2026-10-25', '2026-10-26']);
    expect(nextDays('2026-12-31', 2)).toEqual(['2026-12-31', '2027-01-01']);
    expect(dayText('2026-11-01')).toBe('1 novembre');
  });
});
