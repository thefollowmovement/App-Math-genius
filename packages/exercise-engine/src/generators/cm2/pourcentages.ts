import { defineGenerator, gcd, n, r } from '../kit';

const PERCENTS = {
  1: [50, 10],
  2: [50, 25, 10],
  3: [10, 20, 25, 50, 75],
  4: [5, 15, 30, 40, 60],
  5: [12, 35, 45, 65, 80],
};

export default defineGenerator({
  skill: 'cm2.pourcentages',
  generate(rng, difficulty) {
    const percent = rng.pick(PERCENTS[difficulty]);
    // A multiple of 100 ÷ gcd(percent, 100) gives a whole result.
    const quantity = (100 / gcd(percent, 100)) * rng.int(1, difficulty < 3 ? 10 : 30);
    const answer = (percent * quantity) / 100;
    return {
      type: 'numeric',
      prompt: `Combien font ${percent} % de ${n(quantity)} ?`,
      check: `${percent} % × ${n(quantity)}`,
      answer: r(answer),
      mistakes: {
        'percent-subtract': [quantity > percent ? r(quantity - percent) : undefined],
        'percent-hundred': [r(percent * quantity)],
      },
      hint:
        percent === 50
          ? 'Prendre 50 %, c’est prendre la moitié.'
          : `${percent} %, c’est ${percent} pour 100.`,
      explanation: [`${n(quantity)} × ${percent} ÷ 100 = ${n(answer)}`],
    };
  },
});
