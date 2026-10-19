import { defineGenerator, n, r, range } from '../kit';

const ITEMS = ['cahier', 'croissant', 'ballon', 'stylo', 'livre'];

export default defineGenerator({
  skill: 'cm1.proportionnalite',
  generate(rng, difficulty) {
    const item = rng.pick(ITEMS);
    const price = rng.int(2, difficulty < 3 ? 5 : 12);
    const first = rng.int(2, difficulty < 4 ? 5 : 9);
    const second = rng.pick(range(2, difficulty < 3 ? 10 : 20, first));
    const total = n(first * price);
    return {
      type: 'numeric',
      prompt: `${first} ${item}s coûtent ${total} €. Combien coûtent ${second} ${item}s ?`,
      check: `${total} ÷ ${first} × ${second}`,
      answer: r(second * price),
      unit: '€',
      hint: `Cherche d’abord le prix d’un seul ${item}.`,
      explanation: [
        `1 ${item} coûte ${total} ÷ ${first} = ${price} €.`,
        `${second} ${item}s coûtent ${second} × ${price} = ${n(second * price)} €.`,
      ],
    };
  },
});
