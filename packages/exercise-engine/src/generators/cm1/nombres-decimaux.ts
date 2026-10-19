import { decimal, defineGenerator, formatDecimal, list, plural } from '../kit';

export default defineGenerator({
  skill: 'cm1.nombres-decimaux',
  generate(rng, difficulty) {
    const units = rng.int(difficulty === 1 ? 1 : 0, difficulty < 3 ? 9 : 99);
    // Difficulty 4 and more may skip the tenths: 3 units and 5 hundredths is 3,05.
    const tenths = rng.int(difficulty >= 4 ? 0 : 1, 9);
    const hundredths = difficulty === 1 ? 0 : rng.int(1, 9);
    const parts = [
      [units, 'unité', ''],
      [tenths, 'dixième', 'dixiemes'],
      [hundredths, 'centième', 'centiemes'],
    ] as const;
    const shown = parts.filter(([count]) => count > 0);
    const words = shown.map(([count, name]) => plural(count, name));
    const answer = decimal(units * 100 + tenths * 10 + hundredths, 2);
    return {
      type: 'numeric',
      prompt: `Écris ce nombre avec une virgule : ${list(words)}.`,
      check: shown.map(([count, , fn]) => (fn ? `${fn}(${count})` : `${count}`)).join(' + '),
      answer,
      forms: ['decimal'],
      hint: 'Les dixièmes s’écrivent juste après la virgule, puis viennent les centièmes.',
      explanation: [`${list(words)} : ${formatDecimal(answer)}`],
    };
  },
});
