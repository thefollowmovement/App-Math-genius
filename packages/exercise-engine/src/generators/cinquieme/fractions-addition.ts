import { add, defineGenerator, frac, r, sub } from '../kit';

export default defineGenerator({
  skill: '5e.fractions-addition',
  generate(rng, difficulty) {
    // The second denominator is a multiple of the first; difficulty 5 wants an irreducible fraction.
    const den = rng.int(2, difficulty < 3 ? 5 : 9);
    const big = den * rng.int(2, difficulty < 3 ? 3 : 4);
    const [a, b] = [rng.int(1, 2 * den - 1), rng.int(1, 2 * big - 1)];
    const minus = difficulty >= 3 && a * big > b * den && rng.chance(0.5);
    const [operator, scaled] = [minus ? '−' : '+', (a * big) / den];
    const answer = (minus ? sub : add)(r(a, den), r(b, big));
    const expression = `${frac(a, den)} ${operator} ${frac(b, big)}`;
    const simplified = answer.den === big ? '' : ` = ${frac(answer.num, answer.den)}`;
    const ask = difficulty === 5 ? 'Donne le résultat sous forme irréductible : ' : '';
    return {
      type: 'numeric',
      prompt: ask ? `${ask}${expression}` : `${expression} = ?`,
      check: expression,
      answer,
      display: 'fraction',
      ...(difficulty === 5 && { forms: ['fraction', 'integer'], irreducible: true }),
      hint: `Écris ${frac(a, den)} avec le dénominateur ${big}.`,
      explanation: [
        `${frac(a, den)} = ${frac(scaled, big)}`,
        `${frac(scaled, big)} ${operator} ${frac(b, big)} = ${frac(minus ? scaled - b : scaled + b, big)}${simplified}`,
      ],
    };
  },
});
