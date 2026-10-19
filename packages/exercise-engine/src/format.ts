import { type Rational, isTerminating, rational } from './rational';

/** Typographic minus sign, as in French textbooks. */
export const MINUS = '−';
/** Narrow no-break space: separates thousands without ever breaking a number across lines. */
export const THOUSANDS_SEPARATOR = ' ';

function groupThousands(digits: string): string {
  return digits.length > 3 ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR) : digits;
}

/** 12500 → "12 500", -7 → "−7". */
export function formatInteger(value: number): string {
  return (value < 0 ? MINUS : '') + groupThousands(Math.abs(value).toString());
}

/** Decimal writing with a comma: 3.25 → "3,25". Throws for values like 1/3. */
export function formatDecimal(value: Rational): string {
  if (!isTerminating(value)) throw new RangeError(`${value.num}/${value.den} is not a decimal`);
  let places = 0;
  while (10 ** places % value.den !== 0) places++;
  const scaled = Math.abs(value.num) * (10 ** places / value.den);
  const digits = scaled.toString().padStart(places + 1, '0');
  const units = groupThousands(digits.slice(0, digits.length - places));
  const decimals = digits.slice(digits.length - places);
  return (value.num < 0 ? MINUS : '') + units + (places > 0 ? `,${decimals}` : '');
}

/** "num/den" as given, without reducing: fraction(6, 8) → "6/8". */
export function formatFraction(num: number, den: number): string {
  return `${num < 0 ? MINUS : ''}${Math.abs(num)}/${den}`;
}

/** Integer, decimal or (reduced) fraction, whichever writes the value exactly. */
export function formatNumber(value: Rational | number): string {
  const exact = typeof value === 'number' ? rational(value) : value;
  if (exact.den === 1) return formatInteger(exact.num);
  return isTerminating(exact) ? formatDecimal(exact) : formatFraction(exact.num, exact.den);
}

/** The expected answer of a numeric exercise, as the interface shows it after a mistake. */
export function formatAnswer(exercise: { answer: Rational; display?: 'fraction' }): string {
  const { num, den } = exercise.answer;
  return exercise.display === 'fraction' && den !== 1
    ? formatFraction(num, den)
    : formatNumber(exercise.answer);
}

/** Number inside a calculation: negatives get parentheses, "(−7) + 4". */
export function formatOperand(value: Rational | number): string {
  const text = formatNumber(value);
  return text.startsWith(MINUS) ? `(${text})` : text;
}
