import { defineGenerator, distinct, n, orderFields, r, rankBy } from '../kit';

const MAX = { 1: 99, 2: 999, 3: 9999, 4: 999, 5: 999 };

export default defineGenerator({
  skill: 'ce2.comparer-ranger-nombres',
  generate(rng, difficulty) {
    // From difficulty 4, the numbers share their thousands digit: only the other digits decide.
    const base = difficulty >= 4 ? rng.int(1, 9) * 1000 : 0;
    const values = distinct(difficulty < 3 ? 4 : 5, () => base + rng.int(1, MAX[difficulty]));
    const direction = rng.pick(['ascending', 'descending'] as const);
    return {
      ...orderFields(
        values.map(n),
        values.map((value) => r(value)),
        direction,
        // Read as words, 1 000 comes before 999: the length of the numbers is overlooked.
        { 'digits-not-length': [rankBy(values.map(String), direction)] },
      ),
      hint: 'Compare d’abord le nombre de chiffres, puis les chiffres un par un en partant de la gauche.',
    };
  },
});
