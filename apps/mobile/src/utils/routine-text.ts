import type { SessionGoal } from '@math-genius/exercise-engine';
import { WEEKDAYS, minuteOfDay, type Routine } from '@math-genius/shared';

import { strings } from '@/i18n';

import { localDate } from './local-date';

const t = strings.routine;
const pad = (value: number) => String(value).padStart(2, '0');

/** "HH:MM" of a minute of the day. */
export const timeText = (minute: number) => `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`;

/** Times on offer in the routine pickers, every quarter of an hour, both ends included. */
export function timeSlots(from: string, to: string): string[] {
  const slots: string[] = [];
  for (let minute = minuteOfDay(from); minute <= minuteOfDay(to); minute += 15) {
    slots.push(timeText(minute));
  }
  return slots;
}

export const goalText = (goal: SessionGoal) =>
  goal.type === 'duration' ? t.goals.duration(goal.minutes) : t.goals.count(goal.count);

export function daysText(days: readonly number[]): string {
  if (days.length === WEEKDAYS.length) return t.everyDay;
  return [...days]
    .sort((a, b) => a - b)
    .map((day) => t.weekdays[day - 1])
    .join(', ');
}

/** The routine in a few lines, for the parent. */
export function routineLines(routine: Routine): string[] {
  const others = [
    ...(routine.wednesdayStartTime ? [t.wednesdayAt(routine.wednesdayStartTime)] : []),
    ...(routine.weekendStartTime ? [t.weekendAt(routine.weekendStartTime)] : []),
  ];
  return [
    t.daysLine(daysText(routine.days)),
    t.startLine(routine.startTime, others),
    t.deadlineLine(routine.deadlineTime),
    t.goalLine(goalText(routine.goal)),
  ];
}

const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
const optionFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/** A calendar day ("YYYY-MM-DD") as a local date. */
function calendarDay(date: string): Date {
  const [year = 1970, month = 1, day = 1] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export const dayText = (date: string) => dayFormat.format(calendarDay(date));
export const dayOptionText = (date: string) => optionFormat.format(calendarDay(date));

/** `count` calendar days from `first` ("YYYY-MM-DD"). */
export function nextDays(first: string, count: number): string[] {
  const start = calendarDay(first);
  return Array.from({ length: count }, (_, index) =>
    localDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)),
  );
}
