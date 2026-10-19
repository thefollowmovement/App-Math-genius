import { defineGenerator, n, range } from '../kit';

const DIVISORS = { 1: [2, 5, 10], 2: [2, 5, 10], 3: [2, 3, 5, 9, 10], 4: [3, 9], 5: [3, 4, 6, 9] };
const SENTENCES = [
  (value: string, divisor: number) => `${value} est un multiple de ${divisor}.`,
  (value: string, divisor: number) => `${value} est divisible par ${divisor}.`,
  (value: string, divisor: number) => `${divisor} est un diviseur de ${value}.`,
];

export default defineGenerator({
  skill: 'cm2.multiples-diviseurs',
  generate(rng, difficulty) {
    const divisor = rng.pick(DIVISORS[difficulty]);
    const quotient = rng.int(4, difficulty < 3 ? 30 : 300);
    const remainder = rng.chance(0.5) ? 0 : rng.pick(range(1, divisor - 1));
    const value = n(divisor * quotient + remainder);
    return {
      type: 'true-false',
      prompt: `Vrai ou faux ? ${rng.pick(SENTENCES)(value, divisor)}`,
      check: `multiple(${value}, ${divisor})`,
      answer: remainder === 0,
      hint: `Essaie de diviser ${value} par ${divisor} : y a-t-il un reste ?`,
      explanation: [
        `${value} = ${divisor} × ${n(quotient)} + ${remainder}`,
        remainder === 0 ? 'Il ne reste rien : c’est vrai.' : `Il reste ${remainder} : c’est faux.`,
      ],
    };
  },
});
