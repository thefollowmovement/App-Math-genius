import { type Rational, rational } from './rational';

export type NumberForm = 'integer' | 'decimal' | 'fraction';

export type TypedNumber = { value: Rational; form: NumberForm; irreducible: boolean };

const MAX_DIGITS = 15;

/**
 * Reads what a child typed on the keypad: "12", "−3", "0,5", "0.5", ",5", "3/4", "1 250".
 * Returns null when it is not a number.
 */
export function parseTypedNumber(text: string): TypedNumber | null {
  let normalized = text.replace(/\s/g, '').replace(/−/g, '-');
  if (/^\(.*\)$/.test(normalized)) normalized = normalized.slice(1, -1);

  const fraction = /^([+-]?\d+)\/([+-]?\d+)$/.exec(normalized);
  if (fraction) {
    const [num, den] = [Number(fraction[1]), Number(fraction[2])];
    if (den === 0 || normalized.length > MAX_DIGITS) return null;
    const value = rational(num, den);
    return { value, form: 'fraction', irreducible: Math.abs(value.num) === Math.abs(num) };
  }

  const decimal = /^([+-]?)(\d*)(?:[.,](\d*))?$/.exec(normalized);
  if (!decimal) return null;
  const [, sign = '', units = '', decimals] = decimal;
  if (units === '' && !decimals) return null;
  if (units.length + (decimals?.length ?? 0) > MAX_DIGITS) return null;

  const places = decimals?.length ?? 0;
  const scaled = Number(`${units || '0'}${decimals ?? ''}`) * (sign === '-' ? -1 : 1);
  return {
    value: rational(scaled, 10 ** places),
    form: decimals === undefined ? 'integer' : 'decimal',
    irreducible: true,
  };
}
