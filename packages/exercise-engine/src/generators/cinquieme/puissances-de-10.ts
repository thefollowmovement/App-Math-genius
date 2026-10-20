import { decimal, defineGenerator, formatDecimal, mul, n, power, r } from '../kit';

export default defineGenerator({
  skill: '5e.puissances-de-10',
  generate(rng, difficulty) {
    const exponent = rng.int(2, difficulty === 2 ? 4 : 7);
    // 10ⁿ alone, then times a whole number, then times a decimal number.
    const factor =
      [r(1), r(rng.int(2, 9))][difficulty - 1] ?? decimal(rng.int(11, 999), rng.int(1, 3));
    const shown =
      difficulty === 1 ? power(10, exponent) : `${formatDecimal(factor)} × ${power(10, exponent)}`;
    const answer = mul(factor, r(10 ** exponent));
    return {
      type: 'numeric',
      prompt: `Écris sans puissance : ${shown}`,
      check: difficulty === 1 ? `10^${exponent}` : `${formatDecimal(factor)} × 10^${exponent}`,
      answer,
      mistakes: {
        'zeros-count': [mul(factor, r(10 ** (exponent - 1))), mul(factor, r(10 ** (exponent + 1)))],
        'exponent-times-ten': [difficulty === 1 ? r(10 * exponent) : undefined],
      },
      hint: `${power(10, exponent)}, c’est 1 suivi de ${exponent} zéros.`,
      explanation: [
        `${power(10, exponent)} = ${n(10 ** exponent)}`,
        ...(difficulty > 1 ? [`${shown} = ${n(answer)}`] : []),
      ],
    };
  },
});
