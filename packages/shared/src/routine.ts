import { z } from 'zod';

/**
 * The daily routine a parent sets for a child, and the day plan derived from it. The same rules
 * run in SQL for the server reminders (supabase/migrations/*_routines.sql): keep both in step.
 */

/** ISO weekdays: 1 = Monday … 7 = Sunday. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const WEDNESDAY: Weekday = 3;
export const WEEKEND: readonly Weekday[] = [6, 7];

/** Session goals on offer, as checked by the routines table. */
export const DURATION_GOALS = [10, 15, 20] as const;
export const COUNT_GOALS = [10, 15, 20, 30] as const;

/** "HH:MM", a time of day to the minute. */
export const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const routineGoalSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('duration'), minutes: z.literal(DURATION_GOALS) }),
  z.object({ type: z.literal('count'), count: z.literal(COUNT_GOALS) }),
]);
export type RoutineGoal = z.infer<typeof routineGoalSchema>;

/** Minutes since midnight of an "HH:MM" (or Postgres "HH:MM:SS") time. */
export function minuteOfDay(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export const routineSchema = z
  .object({
    days: z
      .array(z.int().min(1).max(7))
      .min(1)
      .refine((days) => new Set(days).size === days.length),
    startTime: timeOfDaySchema,
    /** Other start times on Wednesdays and at the weekend, if any. */
    wednesdayStartTime: timeOfDaySchema.nullable(),
    weekendStartTime: timeOfDaySchema.nullable(),
    /** Past it, a planned day without a finished session is missed. */
    deadlineTime: timeOfDaySchema,
    goal: routineGoalSchema,
  })
  .refine(
    (routine) =>
      [routine.startTime, routine.wednesdayStartTime, routine.weekendStartTime].every(
        (start) => start === null || minuteOfDay(start) < minuteOfDay(routine.deadlineTime),
      ),
    { path: ['deadlineTime'] },
  );
export type Routine = z.infer<typeof routineSchema>;

export const DEFAULT_ROUTINE: Routine = {
  days: [1, 2, 3, 4, 5],
  startTime: '17:00',
  wednesdayStartTime: null,
  weekendStartTime: null,
  deadlineTime: '20:30',
  goal: { type: 'duration', minutes: 15 },
};

/** A holiday period, both days included ("YYYY-MM-DD"). */
export type Vacation = { fromDate: string; toDate: string };

/** Longest holiday period: the summer break. */
export const MAX_VACATION_DAYS = 92;

/** Weekday of a calendar day ("YYYY-MM-DD"). */
export function weekdayOf(date: string): Weekday {
  const [year = 1970, month = 1, day = 1] = date.split('-').map(Number);
  const sunday0 = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return (sunday0 === 0 ? 7 : sunday0) as Weekday;
}

/** Start time of the session on a given weekday. */
export function startTimeOn(routine: Routine, weekday: Weekday): string {
  if (weekday === WEDNESDAY && routine.wednesdayStartTime) return routine.wednesdayStartTime;
  if (WEEKEND.includes(weekday) && routine.weekendStartTime) return routine.weekendStartTime;
  return routine.startTime;
}

export type DayPlan =
  | { kind: 'no_routine' }
  | { kind: 'off' }
  | { kind: 'vacation' }
  /** Minutes since midnight. */
  | { kind: 'planned'; start: number; deadline: number };

/** What the routine plans for a calendar day. */
export function dayPlan(
  routine: Routine | null,
  vacations: readonly Vacation[],
  date: string,
): DayPlan {
  if (!routine) return { kind: 'no_routine' };
  // ISO dates compare as strings.
  if (vacations.some(({ fromDate, toDate }) => fromDate <= date && date <= toDate)) {
    return { kind: 'vacation' };
  }
  const weekday = weekdayOf(date);
  if (!routine.days.includes(weekday)) return { kind: 'off' };
  return {
    kind: 'planned',
    start: minuteOfDay(startTimeOn(routine, weekday)),
    deadline: minuteOfDay(routine.deadlineTime),
  };
}
