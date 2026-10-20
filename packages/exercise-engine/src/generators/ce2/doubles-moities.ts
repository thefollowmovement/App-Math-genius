import { defineGenerator, n, r } from '../kit';

const MAX = { 1: 20, 2: 50, 3: 100, 4: 250, 5: 500 };

export default defineGenerator({
  skill: 'ce2.doubles-moities',
  generate(rng, difficulty) {
    const value = rng.int(3, MAX[difficulty]);
    if (rng.chance(0.5)) {
      return {
        type: 'numeric',
        prompt: `Quel est le double de ${n(value)} ?`,
        check: `double(${n(value)})`,
        answer: r(2 * value),
        mistakes: { 'double-half': [r(value, 2)] },
        hint: 'Le double, c’est le nombre ajouté à lui-même.',
        explanation: [`${n(value)} + ${n(value)} = ${n(2 * value)}`],
      };
    }
    return {
      type: 'numeric',
      prompt: `Quelle est la moitié de ${n(2 * value)} ?`,
      check: `moitie(${n(2 * value)})`,
      answer: r(value),
      mistakes: { 'double-half': [r(4 * value)] },
      hint: 'La moitié, c’est le nombre qu’il faut doubler pour retrouver le nombre de départ.',
      explanation: [`${n(value)} + ${n(value)} = ${n(2 * value)}, donc la moitié est ${n(value)}.`],
    };
  },
});
