import { type Rational, compare } from '../rational';

/** Calls `make` until `count` values with distinct keys come out. */
export function distinct<T>(
  count: number,
  make: () => T,
  key: (value: T) => unknown = String,
): T[] {
  const values = new Map<unknown, T>();
  for (let attempt = 0; values.size < count; attempt++) {
    if (attempt > 10_000) throw new Error(`Could not draw ${count} distinct values`);
    const value = make();
    values.set(key(value), value);
  }
  return [...values.values()];
}

/** "a, b et c". */
export function list(items: readonly string[]): string {
  return items.length < 2
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`;
}

/** "1 dixième", "4 dixièmes". */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}

const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** 10 and 3 → "10³". */
export function power(base: number, exponent: number): string {
  return `${base}${[...String(exponent)].map((digit) => SUPERSCRIPT_DIGITS[Number(digit)]).join('')}`;
}

/** Indices of `values` sorted in the given direction. */
export function ranking(
  values: readonly Rational[],
  direction: 'ascending' | 'descending',
): number[] {
  const sign = direction === 'ascending' ? 1 : -1;
  return values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => sign * compare(a.value, b.value))
    .map(({ index }) => index);
}

export function isPrime(value: number): boolean {
  if (value < 2) return false;
  for (let divisor = 2; divisor * divisor <= value; divisor++) {
    if (value % divisor === 0) return false;
  }
  return true;
}

/** Smallest divisor greater than 1. */
export function smallestFactor(value: number): number {
  for (let divisor = 2; divisor * divisor <= value; divisor++) {
    if (value % divisor === 0) return divisor;
  }
  return value;
}

/** Integers from `min` to `max` without `excluded`: rng.pick(range(3, 9, divisor)). */
export function range(min: number, max: number, ...excluded: number[]): number[] {
  const values: number[] = [];
  for (let value = min; value <= max; value++) if (!excluded.includes(value)) values.push(value);
  return values;
}

export type Direction = 'ascending' | 'descending';

export function orderPrompt(direction: Direction): string {
  return `Range ces nombres du plus ${direction === 'ascending' ? 'petit au plus grand' : 'grand au plus petit'}.`;
}

/** "2,05 < 2,15 < 2,5" from the labels and their expected order. */
export function orderSentence(
  labels: readonly string[],
  order: readonly number[],
  direction: Direction,
): string {
  return order.map((index) => labels[index]).join(direction === 'ascending' ? ' < ' : ' > ');
}

export function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

/** Everything an order exercise needs but its hint, from the labels and their values. */
export function orderFields(labels: string[], values: readonly Rational[], direction: Direction) {
  const answer = ranking(values, direction);
  return {
    type: 'order' as const,
    direction,
    items: labels,
    answer,
    prompt: orderPrompt(direction),
    explanation: [orderSentence(labels, answer, direction)],
  };
}
