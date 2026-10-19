import {
  formatDecimal,
  formatFraction,
  formatInteger,
  formatNumber,
  formatOperand,
} from './format';
import { gradeResponse } from './grade';
import { parseTypedNumber } from './parse';
import { createRng } from './random';
import { add, decimal, equals, isTerminating, rational } from './rational';

const NNBSP = ' ';

describe('rational', () => {
  it('stays exact where floats drift', () => {
    expect(add(decimal(1, 1), decimal(2, 1))).toEqual(decimal(3, 1));
    expect(equals(rational(6, 8), rational(-3, -4))).toBe(true);
    expect(rational(0, -5)).toEqual({ num: 0, den: 1 });
  });

  it('knows which values have a decimal writing', () => {
    expect(isTerminating(rational(3, 8))).toBe(true);
    expect(isTerminating(rational(1, 3))).toBe(false);
  });

  it('rejects impossible values', () => {
    expect(() => rational(1, 0)).toThrow();
    expect(() => rational(0.5)).toThrow();
  });
});

describe('format', () => {
  it('writes numbers the French way', () => {
    expect(formatInteger(12500)).toBe(`12${NNBSP}500`);
    expect(formatInteger(-7)).toBe('−7');
    expect(formatDecimal(decimal(325, 2))).toBe('3,25');
    expect(formatDecimal(decimal(-5, 2))).toBe('−0,05');
    expect(formatDecimal(decimal(1234567, 1))).toBe(`123${NNBSP}456,7`);
    expect(formatFraction(6, 8)).toBe('6/8');
    expect(formatNumber(rational(2, 3))).toBe('2/3');
    expect(formatNumber(rational(3, 4))).toBe('0,75');
    expect(formatOperand(-4)).toBe('(−4)');
  });
});

describe('parseTypedNumber', () => {
  it.each([
    ['12', 12, 1, 'integer'],
    [` 1 250 `, 1250, 1, 'integer'],
    ['0,5', 1, 2, 'decimal'],
    ['0.5', 1, 2, 'decimal'],
    [',5', 1, 2, 'decimal'],
    ['−3', -3, 1, 'integer'],
    ['(-3)', -3, 1, 'integer'],
    ['3/4', 3, 4, 'fraction'],
    ['6/8', 3, 4, 'fraction'],
  ] as const)('reads %j', (text, num, den, form) => {
    expect(parseTypedNumber(text)).toMatchObject({ value: { num, den }, form });
  });

  it('tells whether a fraction is irreducible', () => {
    expect(parseTypedNumber('6/8')?.irreducible).toBe(false);
    expect(parseTypedNumber('3/4')?.irreducible).toBe(true);
  });

  it.each(['', '-', ',', 'abc', '1/0', '1,2,3', '12a', '1234567890123456'])(
    'rejects %j',
    (text) => {
      expect(parseTypedNumber(text)).toBeNull();
    },
  );
});

describe('gradeResponse', () => {
  const half = {
    type: 'numeric',
    prompt: '1 ÷ 2 = ?',
    check: '1 ÷ 2',
    answer: rational(1, 2),
    hint: '',
    explanation: ['1/2'],
  } as const;

  it('accepts every writing of the right value by default', () => {
    for (const text of ['0,5', '0.5', '1/2', '2/4', '0,50']) {
      expect(gradeResponse(half, { type: 'numeric', text })).toEqual({ correct: true });
    }
  });

  it('explains why a right value is refused', () => {
    expect(
      gradeResponse({ ...half, forms: ['decimal'] }, { type: 'numeric', text: '1/2' }),
    ).toEqual({
      correct: false,
      reason: 'wrong-form',
    });
    expect(gradeResponse({ ...half, irreducible: true }, { type: 'numeric', text: '2/4' })).toEqual(
      {
        correct: false,
        reason: 'not-irreducible',
      },
    );
    expect(gradeResponse(half, { type: 'numeric', text: 'abc' })).toEqual({
      correct: false,
      reason: 'unreadable',
    });
    expect(gradeResponse(half, { type: 'numeric', text: '0,6' })).toEqual({
      correct: false,
      reason: 'incorrect',
    });
  });

  it('refuses a response of another exercise type', () => {
    expect(gradeResponse(half, { type: 'choice', index: 0 }).correct).toBe(false);
  });
});

describe('createRng', () => {
  it('is reproducible and stays in range', () => {
    const [a, b] = [createRng(7), createRng(7)];
    const draws = Array.from({ length: 1000 }, () => a.int(1, 6));
    expect(draws).toEqual(Array.from({ length: 1000 }, () => b.int(1, 6)));
    expect(new Set(draws)).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it('samples distinct items', () => {
    const sample = createRng(3).sample([1, 2, 3, 4, 5], 5);
    expect([...sample].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
