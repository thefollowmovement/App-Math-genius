import { defineGenerator, distinct, formatDecimal, frac, r, range, swapTenths } from '../kit';

// Denominators: tenths first, then hundredths, halves, quarters, fifths…
const DENS = { 1: [10], 2: [10, 100], 3: [10, 100, 2, 4], 4: [100, 4, 5, 20], 5: [1000, 4, 5, 25] };

export default defineGenerator({
  skill: 'cm2.fractions-decimaux-equivalences',
  generate(rng, difficulty) {
    const fractions = DENS[difficulty].flatMap((den) => range(1, den - 1).map((num) => [num, den]));
    const count = difficulty < 3 ? 3 : 4;
    const picked = distinct(
      count,
      () => rng.pick(fractions),
      ([num = 0, den = 1]) => num / den,
    );
    const left = picked.map(([num = 0, den = 1]) => frac(num, den));
    const values = picked.map(([num = 0, den = 1]) => formatDecimal(r(num, den)));
    const right = rng.shuffle(values);
    return {
      type: 'match',
      left,
      right,
      answer: values.map((value) => right.indexOf(value)),
      mistakes: {
        // 3/10 matched with 0,03 and 3/100 with 0,3.
        'tenths-hundredths': [
          swapTenths(
            picked,
            values.map((value) => right.indexOf(value)),
          ),
        ],
      },
      prompt: 'Relie chaque fraction à son écriture décimale.',
      hint: '1/10 s’écrit 0,1 et 1/100 s’écrit 0,01. Pour 1/4 ou 1/5, pense à des centièmes.',
      explanation: [left.map((label, index) => `${label} = ${values[index]}`).join(' ; ')],
    };
  },
});
