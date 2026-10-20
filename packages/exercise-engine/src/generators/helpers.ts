import type { Mistakes } from '../exercise';
import { formatDecimal } from '../format';
import { type Rational, add, compare, div, mul, rational, sub } from '../rational';

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

/**
 * Everything an order exercise needs but its hint, from the labels and their values. Ranging the
 * other way round is a mistake of every order exercise; `mistakes` adds the generator's own.
 */
export function orderFields(
  labels: string[],
  values: readonly Rational[],
  direction: Direction,
  mistakes: Mistakes<readonly number[]> = {},
) {
  const answer = ranking(values, direction);
  return {
    type: 'order' as const,
    direction,
    items: labels,
    answer,
    prompt: orderPrompt(direction),
    explanation: [orderSentence(labels, answer, direction)],
    mistakes: { 'reverse-order': [[...answer].reverse()], ...mistakes },
  };
}

// Typical mistakes (Exercise.mistakes): what a child who makes them computes. -----------------

const digitsOf = (value: number) => [...String(value)].reverse().map(Number);

/** a + b column by column, forgetting the carries: 47 + 38 → 75. */
export function noCarrySum(a: number, b: number): number {
  const [x, y] = [digitsOf(a), digitsOf(b)];
  const length = Math.max(x.length, y.length);
  return Array.from({ length }, (_, i) => ((x[i] ?? 0) + (y[i] ?? 0)) % 10).reduce(
    (sum, digit, i) => sum + digit * 10 ** i,
    0,
  );
}

/** a × b (b one digit) digit by digit, forgetting the carries: 47 × 3 → 21 (12 + 1 ten). */
export function noCarryProduct(a: number, b: number): number {
  return digitsOf(a).reduce((sum, digit, i) => sum + ((digit * b) % 10) * 10 ** i, 0);
}

/** The order of `keys` in the given direction, as `ranking` does with values. */
export function rankBy(keys: readonly (number | string)[], direction: Direction): number[] {
  const sign = direction === 'ascending' ? 1 : -1;
  return keys
    .map((key, index) => ({ key, index }))
    .sort((a, b) => sign * (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .map(({ index }) => index);
}

/** "2,15" read as 2 and 15: the digits after the comma compared as a whole number. */
export const afterCommaKey = (label: string) => {
  const [whole = '0', decimals = '0'] = label.replace(/\D*$/, '').split(',');
  return Number(whole.replace(/\D/g, '')) * 1e6 + Number(decimals);
};

/** a op b with exact numbers; undefined for a division by zero. */
export function calc(operator: string, a: Rational, b: Rational): Rational | undefined {
  if (operator === '+') return add(a, b);
  if (operator === '−') return sub(a, b);
  if (operator === '×') return mul(a, b);
  return b.num === 0 ? undefined : div(a, b);
}

/** An expression computed from left to right, parentheses and priorities ignored. */
export function leftToRight(expression: string): Rational | undefined {
  const tokens = expression.replace(/[()]/g, '').split(' ').filter(Boolean);
  let value: Rational | undefined = rational(Number(tokens[0]));
  for (let i = 1; i + 1 < tokens.length && value; i += 2) {
    value = calc(tokens[i] ?? '+', value, rational(Number(tokens[i + 1])));
  }
  return value;
}

/** a + b with the last digits aligned instead of the commas: 3,5 + 1,25 → 1,60. */
export function misalignedSum(a: Rational, b: Rational): Rational {
  const written = (value: Rational) => {
    const [whole = '', decimals = ''] = formatDecimal(value).replace(/\s/g, '').split(',');
    return { digits: Number(whole + decimals), places: decimals.length };
  };
  const [x, y] = [written(a), written(b)];
  return rational(x.digits + y.digits, 10 ** Math.max(x.places, y.places));
}

/** A copy of `list` with two places swapped; undefined when one of them is missing (-1). */
export function swapped(list: readonly number[], i: number, j: number): number[] | undefined {
  if (i < 0 || j < 0) return undefined;
  const copy = [...list];
  [copy[i], copy[j]] = [list[j] ?? 0, list[i] ?? 0];
  return copy;
}

/** a op b op c… from left to right; `minusNegative`: − (−3) taken as − 3, a typical mistake. */
export function chain(
  terms: readonly number[],
  operators: readonly string[],
  minusNegative = false,
) {
  return terms.reduce((sum, term, i) => {
    if (i === 0) return term;
    if (operators[i - 1] !== '−') return sum + term;
    return minusNegative ? sum - Math.abs(term) : sum - term;
  }, 0);
}

/** Whether the last digit of `value` alone says it is a multiple of `divisor` (3: 3, 6, 9). */
export const endsLikeMultiple = (value: number, divisor: number) =>
  value % 10 > 0 && (value % 10) % divisor === 0;

/** `answer` with k/10 and k/100 matched the other way round, when both are there. */
export function swapTenths(fractions: readonly number[][], answer: readonly number[]) {
  const tenth = fractions.findIndex(
    ([num, den]) => den === 10 && fractions.some(([k, d]) => k === num && d === 100),
  );
  const num = fractions[tenth]?.[0];
  return swapped(
    answer,
    tenth,
    fractions.findIndex(([k, d]) => k === num && d === 100),
  );
}
