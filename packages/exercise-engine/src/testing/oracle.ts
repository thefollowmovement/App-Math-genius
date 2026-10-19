/**
 * Independent checker used by the tests. It shares no code with the engine: exact BigInt
 * arithmetic and its own reader of French math writing ("3,25", "12 500", "2/7 + 3/7", "−4").
 * A generator bug therefore cannot hide in both the generator and its check.
 */

export type Q = { readonly n: bigint; readonly d: bigint };
export type Value = Q | boolean;

const abs = (x: bigint) => (x < 0n ? -x : x);
const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? abs(a) : gcd(b, a % b));

export function q(n: bigint | number, d: bigint | number = 1n): Q {
  const [num, den] = [BigInt(n), BigInt(d)];
  if (den === 0n) throw new Error('Division by zero');
  const sign = den < 0n ? -1n : 1n;
  const divisor = gcd(num, den) || 1n;
  return { n: (sign * num) / divisor, d: abs(den) / divisor };
}

const add = (a: Q, b: Q) => q(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a: Q, b: Q) => q(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a: Q, b: Q) => q(a.n * b.n, a.d * b.d);
const div = (a: Q, b: Q) => q(a.n * b.d, a.d * b.n);
export const sameValue = (a: Q, b: Q) => a.n * b.d === b.n * a.d;
const less = (a: Q, b: Q) => a.n * b.d < b.n * a.d;
const isWhole = (a: Q) => a.d === 1n;

function pow(base: Q, exponent: Q): Q {
  if (!isWhole(exponent)) throw new Error('Non-integer exponent');
  let result = q(1);
  for (let i = 0n; i < abs(exponent.n); i++) result = mul(result, base);
  return exponent.n < 0n ? div(q(1), result) : result;
}

function isPrime(value: Q): boolean {
  if (!isWhole(value) || value.n < 2n) return false;
  for (let divisor = 2n; divisor * divisor <= value.n; divisor++) {
    if (value.n % divisor === 0n) return false;
  }
  return true;
}

function floorDiv(a: Q, b: Q): Q {
  const exact = div(a, b);
  const floor = exact.n / exact.d - (exact.n < 0n && exact.n % exact.d !== 0n ? 1n : 0n);
  return q(floor);
}

// Units of the same kind, in metres, grams and litres.
const UNITS: Record<string, [kind: string, factor: Q]> = {
  km: ['length', q(1000)],
  hm: ['length', q(100)],
  dam: ['length', q(10)],
  m: ['length', q(1)],
  dm: ['length', q(1, 10)],
  cm: ['length', q(1, 100)],
  mm: ['length', q(1, 1000)],
  kg: ['mass', q(1000)],
  g: ['mass', q(1)],
  mg: ['mass', q(1, 1000)],
  L: ['capacity', q(1)],
  dL: ['capacity', q(1, 10)],
  cL: ['capacity', q(1, 100)],
  mL: ['capacity', q(1, 1000)],
};

type Arg = Value | { unit: string };

const number = (arg: Arg | undefined): Q => {
  if (arg === undefined || typeof arg === 'boolean' || 'unit' in arg)
    throw new Error('Number expected');
  return arg;
};

const FUNCTIONS: Record<string, (args: Arg[]) => Value> = {
  quotient: ([a, b]) => floorDiv(number(a), number(b)),
  reste: ([a, b]) => sub(number(a), mul(number(b), floorDiv(number(a), number(b)))),
  multiple: ([a, b]) => isWhole(div(number(a), number(b))),
  premier: ([a]) => isPrime(number(a)),
  double: ([a]) => mul(q(2), number(a)),
  moitie: ([a]) => div(number(a), q(2)),
  dixiemes: ([a]) => div(number(a), q(10)),
  centiemes: ([a]) => div(number(a), q(100)),
  milliemes: ([a]) => div(number(a), q(1000)),
  perimetre_carre: ([a]) => mul(q(4), number(a)),
  perimetre_rectangle: ([a, b]) => mul(q(2), add(number(a), number(b))),
  aire_carre: ([a]) => mul(number(a), number(a)),
  aire_rectangle: ([a, b]) => mul(number(a), number(b)),
  aigu: ([a]) => less(q(0), number(a)) && less(number(a), q(90)),
  droit: ([a]) => sameValue(number(a), q(90)),
  obtus: ([a]) => less(q(90), number(a)) && less(number(a), q(180)),
  plat: ([a]) => sameValue(number(a), q(180)),
  conversion: ([value, from, to]) => {
    if (!from || !to || typeof from === 'boolean' || typeof to === 'boolean')
      throw new Error('Units expected');
    if (!('unit' in from) || !('unit' in to)) throw new Error('Units expected');
    const [fromKind, fromFactor] = UNITS[from.unit] ?? [];
    const [toKind, toFactor] = UNITS[to.unit] ?? [];
    if (!fromKind || fromKind !== toKind || !fromFactor || !toFactor)
      throw new Error(`Cannot convert ${from.unit} to ${to.unit}`);
    return div(mul(number(value), fromFactor), toFactor);
  },
};

// Tokens ------------------------------------------------------------------------------------------

type Token = { kind: 'number'; value: Q } | { kind: 'symbol' | 'word'; value: string };

const NUMBER = /^(\d{1,3}(?: \d{3})+|\d+)(?:,(\d+))?/;

function readNumber(match: RegExpExecArray): Q {
  const whole = (match[1] ?? '').replace(/ /g, '');
  const decimals = match[2] ?? '';
  return q(BigInt(whole + decimals), 10n ** BigInt(decimals.length));
}

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let rest = expression;
  while (rest.length > 0) {
    const numberMatch = NUMBER.exec(rest);
    const wordMatch = /^[A-Za-zÀ-ÖØ-öø-ÿ_]+/.exec(rest);
    if (rest[0] === ' ') {
      rest = rest.slice(1);
    } else if (numberMatch) {
      tokens.push({ kind: 'number', value: readNumber(numberMatch) });
      rest = rest.slice(numberMatch[0].length);
    } else if (wordMatch) {
      tokens.push({ kind: 'word', value: wordMatch[0] });
      rest = rest.slice(wordMatch[0].length);
    } else if ('+-−×÷/^%()=≠<>≤≥,'.includes(rest[0] ?? '')) {
      tokens.push({ kind: 'symbol', value: rest[0] === '−' ? '-' : (rest[0] ?? '') });
      rest = rest.slice(1);
    } else {
      throw new Error(`Unexpected "${rest[0]}" in "${expression}"`);
    }
  }
  return tokens;
}

// Parser ------------------------------------------------------------------------------------------

/** Evaluates a calculation or a statement: "3 + 4 × 5", "quotient(157, 6)", "2 × 3 + 5 = 11". */
export function evaluate(expression: string): Value {
  const tokens = tokenize(expression);
  let position = 0;
  const peek = () => tokens[position];
  const isSymbol = (...values: string[]) => {
    const token = peek();
    return token?.kind === 'symbol' && values.includes(token.value);
  };
  const isWord = (...values: string[]) => {
    const token = peek();
    return token?.kind === 'word' && values.includes(token.value);
  };
  const text = () => {
    const token = peek();
    return token && token.kind !== 'number' ? token.value : '';
  };
  const expect = (value: string) => {
    if (!isSymbol(value)) throw new Error(`Expected "${value}" in "${expression}"`);
    position++;
  };

  const logical = (): Value => {
    let left = comparison();
    while (isWord('et', 'ou')) {
      const operator = text();
      position++;
      const right = comparison();
      if (typeof left !== 'boolean' || typeof right !== 'boolean')
        throw new Error('Boolean expected');
      left = operator === 'et' ? left && right : left || right;
    }
    return left;
  };

  const comparison = (): Value => {
    const left = additive();
    if (!isSymbol('=', '≠', '<', '>', '≤', '≥')) return left;
    const operator = text();
    position++;
    const [a, b] = [number(left), number(additive())];
    return {
      '=': sameValue(a, b),
      '≠': !sameValue(a, b),
      '<': less(a, b),
      '>': less(b, a),
      '≤': !less(b, a),
      '≥': !less(a, b),
    }[operator] as boolean;
  };

  // Arithmetic levels return booleans untouched when no operator follows (e.g. "premier(37)").
  const additive = (): Value => {
    let value = term();
    while (isSymbol('+', '-')) {
      const operator = text();
      position++;
      const right = number(term());
      value = operator === '+' ? add(number(value), right) : sub(number(value), right);
    }
    return value;
  };

  const term = (): Value => {
    let value = unary();
    while (isSymbol('×', '÷', '/')) {
      const operator = text();
      position++;
      const right = number(unary());
      value = operator === '×' ? mul(number(value), right) : div(number(value), right);
    }
    return value;
  };

  const unary = (): Value => {
    if (isSymbol('-')) {
      position++;
      return mul(q(-1), number(unary()));
    }
    const base = postfix();
    if (!isSymbol('^')) return base;
    position++;
    return pow(number(base), number(unary()));
  };

  const postfix = (): Value => {
    const value = primary();
    if (typeof value !== 'boolean' && 'unit' in value) throw new Error('Unit outside a conversion');
    if (!isSymbol('%')) return value;
    position++;
    return div(number(value), q(100));
  };

  const primary = (): Arg => {
    const token = peek();
    position++;
    if (token?.kind === 'number') return token.value;
    if (token?.kind === 'symbol' && token.value === '(') {
      const value = logical();
      expect(')');
      return value;
    }
    if (token?.kind === 'word' && UNITS[token.value] && !isSymbol('('))
      return { unit: token.value };
    if (token?.kind === 'word') {
      const fn = FUNCTIONS[token.value];
      if (!fn) throw new Error(`Unknown function ${token.value}`);
      expect('(');
      const args: Arg[] = [];
      while (!isSymbol(')')) {
        const next = peek();
        if (next?.kind === 'word' && UNITS[next.value]) {
          args.push({ unit: next.value });
          position++;
        } else {
          args.push(logical());
        }
        if (isSymbol(',')) position++;
      }
      expect(')');
      return fn(args);
    }
    throw new Error(`Unexpected end of "${expression}"`);
  };

  const result = logical();
  if (position !== tokens.length) throw new Error(`Unexpected tokens in "${expression}"`);
  return result;
}

const SUPERSCRIPTS: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
};

/** A number written alone: "12 500", "3,25", "−7", "3/4". */
export function parseNumber(label: string): Q {
  const value = evaluate(label.trim());
  if (typeof value === 'boolean') throw new Error(`"${label}" is not a number`);
  return value;
}

/** Every number written in a text, without signs: "7 × 8 = 56" → 7, 8, 56; "10³" → 10, 3. */
export function numbersIn(text: string): Q[] {
  const normalized = text.replace(
    /[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,
    (digits) => ` ${[...digits].map((digit) => SUPERSCRIPTS[digit]).join('')}`,
  );
  const pattern = /(\d+)\/(\d+)|(?:\d{1,3}(?: \d{3})+|\d+)(?:,\d+)?/g;
  return [...normalized.matchAll(pattern)].flatMap((match) => {
    const values = [readNumber(NUMBER.exec(match[0]) as RegExpExecArray)];
    // "3/4" counts as 3/4 and as its two parts.
    if (match[1] && match[2])
      values.push(q(BigInt(match[1]), BigInt(match[2])), q(BigInt(match[2])));
    return values;
  });
}

/** Converts an engine rational (plain numbers) for comparison. */
export const fromEngine = (value: { num: number; den: number }): Q => q(value.num, value.den);
