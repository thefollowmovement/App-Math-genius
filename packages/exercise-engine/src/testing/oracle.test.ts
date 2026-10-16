import { evaluate, numbersIn, parseNumber, q, sameValue } from './oracle';

const NNBSP = ' ';

describe('oracle', () => {
  it.each([
    ['7 × 8', q(56)],
    ['3 + 4 × 5', q(23)],
    ['(3 + 4) × 5', q(35)],
    ['8 ÷ 2 × 4', q(16)],
    ['2/7 + 3/7', q(5, 7)],
    ['0,1 + 0,2', q(3, 10)],
    [`12${NNBSP}500 + 1`, q(12501)],
    ['(−7) + 4', q(-3)],
    ['5 − (−2) − 10', q(-3)],
    ['25 % × 80', q(20)],
    ['10^3', q(1000)],
    ['3,5 × 10^3', q(3500)],
    ['quotient(157, 6)', q(26)],
    ['reste(157, 6)', q(1)],
    ['double(34)', q(68)],
    ['moitie(9)', q(9, 2)],
    ['3 + dixiemes(4) + centiemes(5)', q(345, 100)],
    ['conversion(3, m, cm)', q(300)],
    ['conversion(2,5, km, m)', q(2500)],
    ['conversion(450, cm, m)', q(9, 2)],
    ['perimetre_rectangle(7, 4)', q(22)],
    ['aire_carre(9)', q(81)],
  ])('computes %s', (expression, expected) => {
    const value = evaluate(expression);
    expect(typeof value).toBe('object');
    expect(sameValue(value as ReturnType<typeof q>, expected)).toBe(true);
  });

  it.each([
    ['premier(37)', true],
    ['premier(91)', false],
    ['premier(2)', true],
    ['premier(1)', false],
    ['multiple(42, 6)', true],
    ['multiple(43, 6)', false],
    ['obtus(135)', true],
    ['aigu(90)', false],
    ['droit(90)', true],
    ['2 × 3 + 5 = 11', true],
    ['2 × (−3) + 5 = 1', false],
    ['1/2 < 2/3 et 3 ≥ 3', true],
  ])('decides %s', (expression, expected) => {
    expect(evaluate(expression)).toBe(expected);
  });

  it('reads numbers as written in French', () => {
    expect(sameValue(parseNumber('−3/4'), q(-3, 4))).toBe(true);
    expect(sameValue(parseNumber('2,05'), q(41, 20))).toBe(true);
    expect(sameValue(parseNumber(`10${NNBSP}000`), q(10000))).toBe(true);
  });

  it('lists the numbers of a text', () => {
    const values = numbersIn('7 × 8 = 56 et 10³ et 3/4').map(({ n, d }) => `${n}/${d}`);
    expect(values).toEqual(['7/1', '8/1', '56/1', '10/1', '3/1', '3/1', '3/4', '4/1']);
  });

  it('rejects unknown writing', () => {
    expect(() => evaluate('7 $ 8')).toThrow();
    expect(() => evaluate('foo(3)')).toThrow();
    expect(() => evaluate('conversion(3, m, kg)')).toThrow();
  });
});
