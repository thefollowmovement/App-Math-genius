import { defineGenerator, n, r, range } from '../kit';

const DIVISORS = { 1: [2, 5], 2: [2, 9], 3: [3, 9], 4: [6, 9], 5: [11, 25] } as const;

export default defineGenerator({
  skill: 'cm1.division-euclidienne',
  generate(rng, difficulty) {
    const [min, max] = DIVISORS[difficulty];
    const divisor = rng.int(min, max);
    // The quotient differs from the divisor, so the answer is never a number of the prompt.
    const quotient = rng.pick(range(3, difficulty * 8, divisor));
    const remainder = rng.int(difficulty === 1 ? 0 : 1, divisor - 1);
    const dividend = n(divisor * quotient + remainder);
    const asked = rng.pick(['reste', 'quotient'] as const);
    const answer = asked === 'reste' ? remainder : quotient;
    return {
      type: 'numeric',
      prompt: `Quel est le ${asked} de la division de ${dividend} par ${divisor} ?`,
      check: `${asked}(${dividend}, ${divisor})`,
      answer: r(answer),
      hint: `Cherche le plus grand multiple de ${divisor} qui ne dépasse pas ${dividend}.`,
      explanation: [
        `${dividend} = ${divisor} × ${quotient} + ${remainder}`,
        `Le ${asked} est ${answer}.`,
      ],
    };
  },
});
