/**
 * French formats of the recaps (emails and PDF): days, months, periods, durations, rates. Dates
 * are calendar days ("YYYY-MM-DD") of the family's calendar, already computed by the database.
 */

export const NBSP = ' ';

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

/** ISO weekdays, 1 = Monday. */
const WEEKDAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const;

type Day = { year: number; month: number; day: number };

export function dayOf(date: string): Day {
  const [year = 1970, month = 1, day = 1] = date.split('-').map(Number);
  return { year, month, day };
}

/** 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: string): number {
  const { year, month, day } = dayOf(date);
  const sunday0 = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return sunday0 === 0 ? 7 : sunday0;
}

export const weekdayName = (weekday: number) => WEEKDAYS[(weekday - 1 + 7) % 7] ?? '';
export const monthName = (date: string) => MONTHS[dayOf(date).month - 1] ?? '';
/** « de septembre », « d’octobre ». */
export const ofMonth = (date: string) => {
  const name = monthName(date);
  return /^[aeiouéèh]/.test(name) ? `d’${name}` : `de ${name}`;
};
const dayNumber = (day: number) => (day === 1 ? '1er' : String(day));

/** « mardi 1er septembre ». */
export const longDay = (date: string) =>
  `${weekdayName(isoWeekday(date))} ${dayNumber(dayOf(date).day)} ${monthName(date)}`;

/** « du 14 au 20 septembre », « du 28 septembre au 4 octobre ». */
export function period(from: string, to: string): string {
  const start = dayOf(from);
  const end = dayOf(to);
  if (start.month === end.month && start.year === end.year) {
    return `du ${dayNumber(start.day)} au ${dayNumber(end.day)} ${monthName(to)}`;
  }
  return `du ${dayNumber(start.day)} ${monthName(from)} au ${dayNumber(end.day)} ${monthName(to)}`;
}

/** « septembre 2026 ». */
export const monthYear = (date: string) => `${monthName(date)} ${dayOf(date).year}`;

/** The month after the one of `date`, as its first day. */
export function nextMonth(date: string): string {
  const { year, month } = dayOf(date);
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  return `${next.year}-${String(next.month).padStart(2, '0')}-01`;
}

/** « mercredi 9 » (within a month). */
export const shortDay = (date: string) =>
  `${weekdayName(isoWeekday(date))} ${dayNumber(dayOf(date).day)}`;

/** Days of a month, as « mercredi 9, vendredi 11 et mardi 29 ». */
export const dayList = (dates: readonly string[]) => joinAnd(dates.map(shortDay));

export function joinAnd(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`;
}

/** 1 050, with a no-break space. */
export const integer = (value: number) =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

/** « 79 % ». */
export const percent = (rate: number) => `${Math.round(rate * 100)}${NBSP}%`;

/** « 45 min », « 1 h », « 4 h 05 ». */
export function duration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total}${NBSP}min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0
    ? `${hours}${NBSP}h`
    : `${hours}${NBSP}h${NBSP}${String(rest).padStart(2, '0')}`;
}

/** « 1 séance », « 4 séances ». */
export const count = (value: number, one: string, many: string) =>
  `${integer(value)}${NBSP}${value > 1 ? many : one}`;
