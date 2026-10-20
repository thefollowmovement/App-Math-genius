import { defineGenerator, frac, range, r } from '../kit';

export default defineGenerator({
  skill: 'cm2.fractions-addition-meme-denominateur',
  generate(rng, difficulty) {
    const den = rng.int(3, difficulty < 3 ? 9 : 12);
    // Up to difficulty 2 the sum stays below 1; then it can go beyond, and subtractions appear.
    const limit = difficulty < 3 ? den - 1 : 2 * den;
    const a = rng.pick(range(1, limit - 1));
    const b = rng.pick(range(1, limit - a));
    const subtract = difficulty >= 3 && a !== b && rng.chance(0.5);
    const [first, second] = subtract && a < b ? [b, a] : [a, b];
    const operator = subtract ? '−' : '+';
    const resultNum = subtract ? first - second : first + second;
    const expression = `${frac(first, den)} ${operator} ${frac(second, den)}`;
    return {
      type: 'numeric',
      prompt: `${expression} = ?`,
      check: expression,
      answer: r(resultNum, den),
      mistakes: { 'adds-denominators': [subtract ? undefined : r(resultNum, 2 * den)] },
      display: 'fraction',
      hint: 'Les dénominateurs sont les mêmes : regarde seulement les numérateurs.',
      explanation: [
        `${first} ${operator} ${second} = ${resultNum}, donc ${expression} = ${frac(resultNum, den)}.`,
      ],
    };
  },
});
