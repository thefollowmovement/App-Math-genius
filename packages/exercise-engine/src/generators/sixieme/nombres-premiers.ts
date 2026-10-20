import { defineGenerator, isPrime, range, smallestFactor } from '../kit';

const MAX = { 1: 20, 2: 30, 3: 50, 4: 100, 5: 100 };

export default defineGenerator({
  skill: '6e.nombres-premiers',
  generate(rng, difficulty) {
    const numbers = range(4, MAX[difficulty]);
    // From difficulty 4, the wrong options are odd: no even number to rule out at a glance.
    const composites = numbers.filter((x) => !isPrime(x) && (difficulty < 4 || x % 2 === 1));
    const prime = rng.pick(numbers.filter(isPrime));
    const options = rng.shuffle([prime, ...rng.sample(composites, 3)]);
    const others = options.filter((x) => x !== prime);
    return {
      type: 'choice',
      prompt: 'Lequel de ces nombres est premier ?',
      options: options.map((x) => ({ label: String(x), check: `premier(${x})` })),
      answer: options.indexOf(prime),
      mistakes: {
        'odd-is-prime': options.map((x, i) => (x % 2 === 1 && x !== prime ? i : undefined)),
      },
      hint: 'Un nombre premier a exactement deux diviseurs : 1 et lui-même.',
      explanation: [
        `${prime} n’est divisible que par 1 et par lui-même.`,
        others.map((x) => `${x} = ${smallestFactor(x)} × ${x / smallestFactor(x)}`).join(' ; '),
      ],
    };
  },
});
