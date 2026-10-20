import { defineGenerator, n, r } from '../kit';

const PAIRS = [
  ['m', 'cm', 100],
  ['cm', 'mm', 10],
  ['km', 'm', 1000],
  ['m', 'mm', 1000],
] as const;

export default defineGenerator({
  skill: 'ce2.longueurs-conversions',
  generate(rng, difficulty) {
    const [big, small, factor] = rng.pick(PAIRS.slice(0, Math.min(difficulty + 1, PAIRS.length)));
    const count = rng.int(2, difficulty < 3 ? 9 : 25);
    // From difficulty 4, also convert towards the bigger unit.
    const reverse = difficulty >= 4 && rng.chance(0.5);
    const [value, answer] = reverse ? [count * factor, count] : [count, count * factor];
    const [from, to] = reverse ? [small, big] : [big, small];
    return {
      type: 'numeric',
      prompt: `${n(value)} ${from} = ? ${to}`,
      check: `conversion(${n(value)}, ${from}, ${to})`,
      answer: r(answer),
      mistakes: {
        'conversion-factor': [r(answer * 10), r(answer, 10)],
        'conversion-direction': [reverse ? r(value * factor) : r(value, factor)],
      },
      unit: to,
      hint: `Combien de ${small} dans 1 ${big} ?`,
      explanation: [
        `1 ${big} = ${n(factor)} ${small}, donc ${n(value)} ${from} = ${n(answer)} ${to}.`,
      ],
    };
  },
});
