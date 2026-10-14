import { defineGenerator, n, r } from '../kit';

const DENS = {
  1: [2, 3, 4],
  2: [2, 3, 4, 5],
  3: [3, 4, 5, 6],
  4: [4, 5, 6, 8, 10],
  5: [6, 7, 8, 9, 12],
};

export default defineGenerator({
  skill: '6e.fraction-d-une-quantite',
  generate(rng, difficulty) {
    const den = rng.pick(DENS[difficulty]);
    // Unit fractions first, then any numerator below the denominator.
    const num = difficulty < 3 ? 1 : rng.int(2, den - 1);
    const part = rng.int(2, difficulty < 4 ? 10 : 25);
    const quantity = den * part;
    return {
      type: 'numeric',
      prompt: `Combien font ${num}/${den} de ${n(quantity)} ?`,
      check: `${num}/${den} × ${n(quantity)}`,
      answer: r(num * part),
      hint: `Partage d’abord ${n(quantity)} en ${den} parts égales.`,
      explanation: [
        `${n(quantity)} ÷ ${den} = ${n(part)}`,
        `${n(part)} × ${num} = ${n(num * part)}`,
      ],
    };
  },
});
