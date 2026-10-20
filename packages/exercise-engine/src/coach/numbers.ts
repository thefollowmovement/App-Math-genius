import { MINUS } from '../format';
import { type Rational, equals, rational } from '../rational';

/**
 * The numbers written in a text, as the engine writes them (format.ts): "12 500" (narrow no-break
 * space), "3,25", "3/4", "−7", and exponents "10³". The coach's explanations may only show numbers
 * of the exercise and of its correction (docs/specs.md, Coach IA : contrôles automatiques).
 */

export type NumberToken = {
  /** As written, sign included: what a slot puts back in the text. */
  text: string;
  start: number;
  end: number;
  /** Without sign; a fraction is one value. */
  value: Rational;
};

const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
// Thousands are grouped with a narrow (or plain) no-break space, never with a breaking space.
const NUMBER = new RegExp(
  `${MINUS}?(?:(\\d+)/(\\d+)|\\d{1,3}(?:[\\u202f\\u00a0]\\d{3})+(?:,\\d+)?|\\d+(?:,\\d+)?)|[${SUPERSCRIPTS}]+`,
  'g',
);

function valueOf(text: string): Rational {
  const unsigned = text.startsWith(MINUS) ? text.slice(MINUS.length) : text;
  if (SUPERSCRIPTS.includes(unsigned.charAt(0))) {
    return rational(Number([...unsigned].map((digit) => SUPERSCRIPTS.indexOf(digit)).join('')));
  }
  const fraction = /^(\d+)\/(\d+)$/.exec(unsigned);
  if (fraction) return rational(Number(fraction[1]), Number(fraction[2]) || 1);
  const [units = '0', decimals = ''] = unsigned.replace(/[  ]/g, '').split(',');
  return rational(Number(units + decimals), 10 ** decimals.length);
}

export function numberTokens(text: string): NumberToken[] {
  return [...text.matchAll(NUMBER)].map((match) => ({
    text: match[0],
    start: match.index,
    end: match.index + match[0].length,
    value: valueOf(match[0]),
  }));
}

/** Every value written in a text; a fraction also counts its two parts ("3/4": 3/4, 3, 4). */
export function numbersOf(text: string): Rational[] {
  return numberTokens(text).flatMap((token) => {
    const parts = /(\d+)\/(\d+)/.exec(token.text);
    return parts
      ? [token.value, rational(Number(parts[1])), rational(Number(parts[2]))]
      : [token.value];
  });
}

/** The numbers of `text` that are none of `allowed` (by value: 0,30 is 0,3). */
export function foreignNumbers(text: string, allowed: readonly Rational[]): string[] {
  return numberTokens(text)
    .filter((token) => !allowed.some((value) => equals(value, token.value)))
    .map((token) => token.text);
}
