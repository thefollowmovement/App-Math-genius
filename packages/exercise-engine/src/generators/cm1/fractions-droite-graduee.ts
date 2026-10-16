import { defineGenerator, r, range } from '../kit';

const DENS = {
  1: [2, 3, 4],
  2: [3, 4, 5],
  3: [4, 5, 6, 8, 10],
  4: [3, 4, 5, 6, 8],
  5: [3, 4, 6, 8, 10],
};

export default defineGenerator({
  skill: 'cm1.fractions-droite-graduee',
  generate(rng, difficulty) {
    // From difficulty 4 the line goes beyond 1, so fractions can be greater than 1.
    const units = difficulty >= 4 ? difficulty - 2 : 1;
    const fractions = DENS[difficulty].flatMap((d) => range(1, d * units - 1).map((k) => [k, d]));
    const [num = 1, den = 2] = rng.pick(fractions.filter(([k = 0, d = 1]) => k % d !== 0));
    return {
      type: 'number-line',
      min: r(0),
      max: r(units),
      step: r(1, den),
      target: `${num}/${den}`,
      answer: r(num, den),
      prompt: `Place ${num}/${den} sur la droite graduée.`,
      hint: `L’unité est partagée en ${den} parts égales : chaque graduation vaut 1/${den}.`,
      explanation: [`${num}/${den}, c’est ${num} graduations de 1/${den} après 0.`],
    };
  },
});
