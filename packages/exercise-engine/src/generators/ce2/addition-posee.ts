import { defineGenerator, n, r } from '../kit';

// Ranges of the two terms; sums stay below 10 000, as in the CE2 programme.
const RANGES = {
  1: [10, 49, 10, 49],
  2: [100, 899, 10, 99],
  3: [100, 499, 100, 499],
  4: [1000, 7999, 100, 999],
  5: [1000, 4999, 1000, 4999],
} as const;

export default defineGenerator({
  skill: 'ce2.addition-posee',
  generate(rng, difficulty) {
    const [aMin, aMax, bMin, bMax] = RANGES[difficulty];
    const [a, b] = [rng.int(aMin, aMax), rng.int(bMin, bMax)];
    return {
      type: 'numeric',
      prompt: `${n(a)} + ${n(b)} = ?`,
      check: `${n(a)} + ${n(b)}`,
      answer: r(a + b),
      hint: 'Pose l’addition en alignant les unités, puis calcule de droite à gauche sans oublier les retenues.',
      explanation: [
        'On additionne colonne par colonne, en commençant par les unités.',
        `${n(a)} + ${n(b)} = ${n(a + b)}`,
      ],
    };
  },
});
