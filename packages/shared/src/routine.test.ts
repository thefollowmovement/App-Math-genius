import {
  DEFAULT_ROUTINE,
  type Routine,
  dayPlan,
  minuteOfDay,
  routineSchema,
  startTimeOn,
  weekdayOf,
} from './routine';

const routine: Routine = {
  ...DEFAULT_ROUTINE,
  days: [1, 2, 3, 4, 5, 6],
  wednesdayStartTime: '14:00',
  weekendStartTime: '10:30',
};

describe('routine', () => {
  it('accepts the default routine', () => {
    expect(routineSchema.parse(DEFAULT_ROUTINE)).toEqual(DEFAULT_ROUTINE);
  });

  it('rejects a deadline before a start time, an empty week and odd goals', () => {
    const invalid = (change: Partial<Record<keyof Routine, unknown>>) =>
      routineSchema.safeParse({ ...DEFAULT_ROUTINE, ...change }).error?.issues[0]?.path;
    expect(invalid({ deadlineTime: '17:00' })).toEqual(['deadlineTime']);
    expect(invalid({ weekendStartTime: '21:00' })).toEqual(['deadlineTime']);
    expect(invalid({ days: [] })).toEqual(['days']);
    expect(invalid({ days: [1, 1] })).toEqual(['days']);
    expect(invalid({ days: [0] })).toEqual(['days', 0]);
    expect(invalid({ startTime: '7:00' })).toEqual(['startTime']);
    expect(invalid({ goal: { type: 'duration', minutes: 12 } })).toEqual(['goal', 'minutes']);
    expect(invalid({ goal: { type: 'count', count: 30 } })).toBeUndefined();
  });

  it('reads times as minutes of the day, with or without seconds', () => {
    expect(minuteOfDay('17:30')).toBe(1050);
    expect(minuteOfDay('20:30:00')).toBe(1230);
  });

  it('finds the weekday of a calendar day', () => {
    // 12 October 2026 is a Monday.
    expect(['2026-10-12', '2026-10-14', '2026-10-17', '2026-10-18'].map(weekdayOf)).toEqual([
      1, 3, 6, 7,
    ]);
  });

  it('starts later on Wednesdays and at the weekend when asked', () => {
    expect(startTimeOn(routine, 1)).toBe('17:00');
    expect(startTimeOn(routine, 3)).toBe('14:00');
    expect(startTimeOn(routine, 6)).toBe('10:30');
    expect(startTimeOn(DEFAULT_ROUTINE, 6)).toBe('17:00');
  });

  it('plans planned days, days off and holidays', () => {
    const vacations = [{ fromDate: '2026-10-17', toDate: '2026-11-01' }];
    expect(dayPlan(null, [], '2026-10-12')).toEqual({ kind: 'no_routine' });
    expect(dayPlan(routine, vacations, '2026-10-14')).toEqual({
      kind: 'planned',
      start: 14 * 60,
      deadline: 20 * 60 + 30,
    });
    expect(dayPlan(routine, [], '2026-10-18')).toEqual({ kind: 'off' });
    expect(dayPlan(routine, vacations, '2026-10-17')).toEqual({ kind: 'vacation' });
    expect(dayPlan(routine, vacations, '2026-11-01')).toEqual({ kind: 'vacation' });
    expect(dayPlan(routine, vacations, '2026-11-02')).toMatchObject({ kind: 'planned' });
  });
});
