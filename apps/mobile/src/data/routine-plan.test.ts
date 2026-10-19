import { DEFAULT_ROUTINE, type Routine } from '@math-genius/shared';

import {
  type RoutineRow,
  type Routines,
  childPlan,
  routineFromRow,
  routineOf,
  routineRow,
  vacationsOf,
} from './routine-plan';

const routine: Routine = {
  ...DEFAULT_ROUTINE,
  days: [1, 2, 3, 4, 5, 6],
  wednesdayStartTime: '14:00',
  weekendStartTime: '10:30',
  goal: { type: 'count', count: 20 },
};

/** As PostgREST returns it: times with seconds. */
const stored: RoutineRow = {
  child_id: 'lea',
  days: [6, 1, 2, 3, 4, 5],
  start_time: '17:00:00',
  wednesday_start_time: '14:00:00',
  weekend_start_time: '10:30:00',
  deadline_time: '20:30:00',
  goal_type: 'count',
  goal_value: 20,
};

describe('routines from the server', () => {
  it('reads a stored routine and writes it back the same', () => {
    expect(routineFromRow(stored)).toEqual(routine);
    expect(routineRow('lea', routine)).toEqual({
      ...stored,
      days: [1, 2, 3, 4, 5, 6],
      start_time: '17:00',
      wednesday_start_time: '14:00',
      weekend_start_time: '10:30',
      deadline_time: '20:30',
    });
    expect(routineFromRow({ ...stored, weekend_start_time: null })?.weekendStartTime).toBeNull();
  });

  it('ignores a routine this version does not understand', () => {
    expect(routineFromRow({ ...stored, goal_type: 'duration', goal_value: 45 })).toBeNull();
  });

  it('plans each child’s day from their routine and holidays', () => {
    const data: Routines = {
      routines: { lea: routine },
      vacations: [{ id: 'v', child_id: 'lea', from_date: '2026-10-17', to_date: '2026-11-01' }],
    };
    expect(routineOf(data, 'lea')).toBe(routine);
    expect(routineOf(data, 'tom')).toBeNull();
    expect(vacationsOf(data, 'tom')).toEqual([]);
    expect(childPlan(data, 'lea', '2026-10-14')).toEqual({
      kind: 'planned',
      start: 14 * 60,
      deadline: 20 * 60 + 30,
    });
    expect(childPlan(data, 'lea', '2026-10-24')).toEqual({ kind: 'vacation' });
    expect(childPlan(data, 'tom', '2026-10-14')).toEqual({ kind: 'no_routine' });
    expect(childPlan(undefined, 'lea', '2026-10-14')).toEqual({ kind: 'no_routine' });
  });
});
