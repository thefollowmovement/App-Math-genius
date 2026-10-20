import { defineGenerator } from '../kit';

const DENOMINATORS = {
  1: [2, 3, 4],
  2: [2, 3, 4, 5, 6],
  3: [3, 4, 5, 6, 8],
  4: [4, 5, 6, 8, 10],
  5: [3, 4, 5, 6],
};

export default defineGenerator({
  skill: 'ce2.fractions-unitaires',
  generate(rng, difficulty) {
    const den = rng.pick(DENOMINATORS[difficulty]);
    // The bar can have more parts than the denominator: 1/3 of 6 parts is 2 parts.
    const group = rng.int(1, difficulty < 3 ? 2 : 3);
    return {
      type: 'fraction-shade',
      parts: den * group,
      fraction: `1/${den}`,
      answer: group,
      mistakes: { 'one-part-only': [1], 'shades-denominator': [den] },
      prompt: `Colorie 1/${den} de la barre.`,
      hint: `Regroupe les parts pour former ${den} morceaux égaux.`,
      explanation: [
        `${den * group} parts ÷ ${den} = ${group} : on colorie ${group} part${group > 1 ? 's' : ''}.`,
      ],
    };
  },
});
