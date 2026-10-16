import { defineGenerator, n, r } from '../kit';

const RANGES = { 1: [11, 30], 2: [12, 99], 3: [100, 499], 4: [100, 999], 5: [1000, 1999] } as const;

export default defineGenerator({
  skill: 'ce2.multiplication-posee',
  generate(rng, difficulty) {
    const [min, max] = RANGES[difficulty];
    const a = rng.int(min, max);
    const b = rng.int(difficulty === 1 ? 2 : 3, difficulty === 1 ? 5 : 9);
    return {
      type: 'numeric',
      prompt: `${n(a)} × ${b} = ?`,
      check: `${n(a)} × ${b}`,
      answer: r(a * b),
      hint: 'Multiplie d’abord les unités, puis les dizaines, sans oublier les retenues.',
      explanation: [
        `On multiplie chaque chiffre de ${n(a)} par ${b}, en commençant par les unités.`,
        `${n(a)} × ${b} = ${n(a * b)}`,
      ],
    };
  },
});
