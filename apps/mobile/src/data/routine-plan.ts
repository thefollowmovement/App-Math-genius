import {
  dayPlan,
  routineSchema,
  type DayPlan,
  type Routine,
  type Tables,
  type Vacation,
} from '@math-genius/shared';

/** Routines as stored by Supabase and as the app reads them, without Supabase (testable). */

export type RoutineRow = Pick<
  Tables<'routines'>,
  | 'child_id'
  | 'days'
  | 'start_time'
  | 'wednesday_start_time'
  | 'weekend_start_time'
  | 'deadline_time'
  | 'goal_type'
  | 'goal_value'
>;
export type VacationRow = Pick<Tables<'vacations'>, 'id' | 'child_id' | 'from_date' | 'to_date'>;

export const ROUTINE_COLUMNS =
  'child_id, days, start_time, wednesday_start_time, weekend_start_time, deadline_time, goal_type, goal_value';

/** Postgres returns "HH:MM:SS"; routines are set to the minute. */
const minutes = (time: string) => time.slice(0, 5);
const optionalMinutes = (time: string | null) => (time === null ? null : minutes(time));

/** The routine as the app uses it; null if the row has a shape this version does not know. */
export function routineFromRow(row: RoutineRow): Routine | null {
  const parsed = routineSchema.safeParse({
    days: [...row.days].sort((a, b) => a - b),
    startTime: minutes(row.start_time),
    wednesdayStartTime: optionalMinutes(row.wednesday_start_time),
    weekendStartTime: optionalMinutes(row.weekend_start_time),
    deadlineTime: minutes(row.deadline_time),
    goal:
      row.goal_type === 'duration'
        ? { type: 'duration', minutes: row.goal_value }
        : { type: 'count', count: row.goal_value },
  });
  return parsed.success ? parsed.data : null;
}

export function routineRow(childId: string, routine: Routine): RoutineRow {
  return {
    child_id: childId,
    days: routine.days,
    start_time: routine.startTime,
    wednesday_start_time: routine.wednesdayStartTime,
    weekend_start_time: routine.weekendStartTime,
    deadline_time: routine.deadlineTime,
    goal_type: routine.goal.type,
    goal_value: routine.goal.type === 'duration' ? routine.goal.minutes : routine.goal.count,
  };
}

const vacationOf = (row: VacationRow): Vacation => ({
  fromDate: row.from_date,
  toDate: row.to_date,
});

/** Routines and current or upcoming holidays of the children the user may see. */
export type Routines = {
  routines: Record<string, Routine>;
  vacations: VacationRow[];
};

export const routineOf = (data: Routines | undefined, childId: string): Routine | null =>
  data?.routines[childId] ?? null;

export const vacationsOf = (data: Routines | undefined, childId: string): VacationRow[] =>
  (data?.vacations ?? []).filter((vacation) => vacation.child_id === childId);

/** What the routine plans for a child on a day ("YYYY-MM-DD"). */
export const childPlan = (data: Routines | undefined, childId: string, date: string): DayPlan =>
  dayPlan(routineOf(data, childId), vacationsOf(data, childId).map(vacationOf), date);
