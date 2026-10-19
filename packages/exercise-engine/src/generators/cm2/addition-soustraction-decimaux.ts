import { add, compare, decimal, defineGenerator, n, sub } from '../kit';

// Decimal places of each term: from difficulty 2 they differ, so the commas must be aligned.
const PLACES = { 1: [1, 1], 2: [1, 2], 3: [2, 2], 4: [0, 2], 5: [3, 1] } as const;

export default defineGenerator({
  skill: 'cm2.addition-soustraction-decimaux',
  generate(rng, difficulty) {
    const max = difficulty < 3 ? 99 : 999;
    const draw = (places: number) => decimal(rng.int(10 ** places, max * 10 ** places), places);
    const [x, y] = PLACES[difficulty].map(draw) as [
      ReturnType<typeof draw>,
      ReturnType<typeof draw>,
    ];
    const operator = difficulty >= 3 && rng.chance(0.5) ? '−' : '+';
    // Subtractions keep a positive result: the bigger number comes first.
    const [a, b] = operator === '−' && compare(x, y) < 0 ? [y, x] : [x, y];
    const answer = operator === '−' ? sub(a, b) : add(a, b);
    return {
      type: 'numeric',
      prompt: `${n(a)} ${operator} ${n(b)} = ?`,
      check: `${n(a)} ${operator} ${n(b)}`,
      answer,
      hint: 'Pose l’opération en alignant les virgules. Tu peux compléter avec des zéros.',
      explanation: [
        'On aligne les virgules, puis on calcule comme avec des entiers.',
        `${n(a)} ${operator} ${n(b)} = ${n(answer)}`,
      ],
    };
  },
});
