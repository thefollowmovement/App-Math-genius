import { calc, defineGenerator, n, r } from '../kit';

const OPPOSITE = { '+': '−', '−': '+', '×': '÷', '÷': '×' } as const;

export default defineGenerator({
  skill: 'cm2.expressions-inconnue',
  generate(rng, difficulty) {
    const operator = rng.pick(
      difficulty < 3 ? (['+', '−'] as const) : (['+', '−', '×', '÷'] as const),
    );
    const additive = operator === '+' || operator === '−';
    const [x, y] = [rng.int(2, additive ? 25 * difficulty : 9 + difficulty), rng.int(2, 12)];
    // "a op b = c": a subtraction or a division is the addition or multiplication read backwards.
    const combined = additive ? x + y : x * y;
    const [a, b, c] = operator === '−' || operator === '÷' ? [combined, y, x] : [x, y, combined];
    const hideA = rng.chance(0.5);
    const backwards = operator === '−' || operator === '÷';
    return {
      type: 'numeric',
      prompt: `Quel nombre manque ? ${hideA ? '?' : n(a)} ${operator} ${hideA ? n(b) : '?'} = ${n(c)}`,
      check:
        hideA || !backwards
          ? `${n(c)} ${OPPOSITE[operator]} ${n(hideA ? b : a)}`
          : `${n(a)} ${operator} ${n(c)}`,
      answer: r(hideA ? a : b),
      mistakes: {
        // The other operation on the same two numbers: 12 + 7 for ? + 7 = 12.
        'inverse-operation': [
          hideA || !backwards
            ? calc(operator, r(c), r(hideA ? b : a))
            : calc(OPPOSITE[operator], r(a), r(c)),
        ],
      },
      hint: 'Utilise l’opération inverse pour retrouver le nombre manquant.',
      explanation: [`${n(a)} ${operator} ${n(b)} = ${n(c)}, donc il manque ${n(hideA ? a : b)}.`],
    };
  },
});
