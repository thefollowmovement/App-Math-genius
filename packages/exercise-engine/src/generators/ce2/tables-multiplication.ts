import { defineGenerator, n, r } from '../kit';

const TABLES = { 1: [2, 5, 10], 2: [2, 3, 4, 5, 10], 3: [2, 3, 4, 5, 6, 7, 8, 9], 4: [6, 7, 8, 9] };

export default defineGenerator({
  skill: 'ce2.tables-multiplication',
  generate(rng, difficulty) {
    const missing = difficulty === 5;
    const a = rng.pick(TABLES[missing ? 4 : difficulty]);
    // A hidden factor equal to the shown one would give the answer away.
    const b = rng.pick([2, 3, 4, 5, 6, 7, 8, 9, 10].filter((value) => !missing || value !== a));
    const product = n(a * b);
    return {
      type: 'numeric',
      prompt: missing ? `${a} × ? = ${product}` : `${a} × ${b} = ?`,
      check: missing ? `${product} ÷ ${a}` : `${a} × ${b}`,
      answer: r(missing ? b : a * b),
      mistakes: missing
        ? { 'table-neighbour': [r(b - 1), r(b + 1)] }
        : {
            'table-neighbour': [r(a * (b - 1)), r(a * (b + 1))],
            'adds-instead-of-multiplying': [r(a + b)],
          },
      hint: `Pense à la table de ${a}.`,
      explanation: [`${a} × ${b} = ${product}`],
    };
  },
});
