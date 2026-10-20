import { add, decimal, defineGenerator, mul, n, r, range } from '../kit';

export default defineGenerator({
  skill: '6e.proportionnalite',
  generate(rng, difficulty) {
    // The coefficient is whole up to difficulty 3, then decimal (1,5 ; 2,5…).
    const coefficient =
      difficulty < 4 ? r(rng.int(2, 3 + 2 * difficulty)) : decimal(rng.int(1, 9) * 10 + 5, 1);
    const first = rng.pick(range(2, 12).filter((x) => mul(coefficient, r(x)).den === 1));
    const second = rng.pick(
      range(2, difficulty < 3 ? 12 : 30, first).filter((x) => mul(coefficient, r(x)).den === 1),
    );
    const [y1, answer] = [mul(coefficient, r(first)), mul(coefficient, r(second))];
    return {
      type: 'numeric',
      prompt: `Dans ce tableau de proportionnalité, ${first} correspond à ${n(y1)}. À quoi correspond ${second} ?`,
      check: `${n(y1)} ÷ ${first} × ${second}`,
      answer,
      mistakes: { 'additive-reasoning': [add(y1, r(second - first))] },
      hint: 'Cherche par combien il faut multiplier la première ligne pour obtenir la seconde.',
      explanation: [
        `${n(y1)} ÷ ${first} = ${n(coefficient)}`,
        `${second} × ${n(coefficient)} = ${n(answer)}`,
      ],
    };
  },
});
