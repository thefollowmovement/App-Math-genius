/** Exact number a/b, always reduced with a positive denominator. Avoids 0.1 + 0.2 surprises. */
export type Rational = { readonly num: number; readonly den: number };

function gcd(a: number, b: number): number {
  let [x, y] = [Math.abs(a), Math.abs(b)];
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

export function rational(num: number, den = 1): Rational {
  if (!Number.isSafeInteger(num) || !Number.isSafeInteger(den) || den === 0) {
    throw new RangeError(`Invalid rational ${num}/${den}`);
  }
  const divisor = gcd(num, den) * Math.sign(den);
  const reducedNum = num / divisor;
  return { num: reducedNum === 0 ? 0 : reducedNum, den: den / divisor };
}

/** `scaled` / 10^places: decimal(325, 2) is 3.25. */
export function decimal(scaled: number, places: number): Rational {
  return rational(scaled, 10 ** places);
}

export const add = (a: Rational, b: Rational) =>
  rational(a.num * b.den + b.num * a.den, a.den * b.den);
export const sub = (a: Rational, b: Rational) =>
  rational(a.num * b.den - b.num * a.den, a.den * b.den);
export const mul = (a: Rational, b: Rational) => rational(a.num * b.num, a.den * b.den);
export const div = (a: Rational, b: Rational) => rational(a.num * b.den, a.den * b.num);

export const equals = (a: Rational, b: Rational) => a.num === b.num && a.den === b.den;
export const compare = (a: Rational, b: Rational) => Math.sign(a.num * b.den - b.num * a.den);
export const isInteger = (value: Rational) => value.den === 1;

/** True when the value has a finite decimal writing (denominator made of 2s and 5s). */
export function isTerminating(value: Rational): boolean {
  let den = value.den;
  while (den % 2 === 0) den /= 2;
  while (den % 5 === 0) den /= 5;
  return den === 1;
}
