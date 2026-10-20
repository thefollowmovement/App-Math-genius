import {
  afterCommaKey,
  decimal,
  defineGenerator,
  distinct,
  formatDecimal,
  orderFields,
  rankBy,
} from '../kit';

export default defineGenerator({
  skill: 'cm1.comparer-decimaux',
  generate(rng, difficulty) {
    // From difficulty 2 all numbers share their whole part: 2,5 against 2,15 is the classic trap.
    const whole = rng.int(0, difficulty < 3 ? 9 : 99);
    const draw = () => {
      const places = rng.int(1, difficulty < 3 ? 2 : 3);
      const units = difficulty === 1 ? rng.int(0, 9) : whole;
      return decimal(units * 10 ** places + rng.int(1, 10 ** places - 1), places);
    };
    const values = distinct(difficulty < 4 ? 4 : 5, draw, formatDecimal);
    const direction = rng.pick(['ascending', 'descending'] as const);
    return {
      ...orderFields(values.map(formatDecimal), values, direction, {
        'decimals-as-integers': [rankBy(values.map(formatDecimal).map(afterCommaKey), direction)],
      }),
      hint: 'Compare la partie entière, puis les dixièmes, puis les centièmes. Ajouter des zéros à la fin ne change rien.',
    };
  },
});
