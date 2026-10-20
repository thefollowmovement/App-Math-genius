import { chain, defineGenerator, n, op, r } from '../kit';

export default defineGenerator({
  skill: '5e.relatifs-addition-soustraction',
  generate(rng, difficulty) {
    const max = [10, 10, 30, 50, 99][difficulty - 1] ?? 10;
    const draw = () => rng.pick([-1, 1]) * rng.int(1, max);
    // Additions first, then subtractions, then chains of three numbers.
    const terms = difficulty >= 4 ? [draw(), draw(), draw()] : [draw(), draw()];
    const operators = terms.slice(1).map(() => (difficulty >= 2 && rng.chance(0.5) ? '−' : '+'));
    const expression = terms
      .map((term, i) => (i === 0 ? op(term) : `${operators[i - 1]} ${op(term)}`))
      .join(' ');
    const value = chain(terms, operators);
    const rule = operators.includes('−')
      ? 'Soustraire, c’est ajouter l’opposé.'
      : 'On additionne en tenant compte des signes.';
    return {
      type: 'numeric',
      prompt: `${expression} = ?`,
      check: expression,
      answer: r(value),
      mistakes: {
        // − (−3) taken as − 3; or the right size with the wrong sign.
        'subtract-negative': [r(chain(terms, operators, true))],
        'sign-error': [r(-value)],
      },
      hint: 'Soustraire un nombre, c’est ajouter son opposé.',
      explanation: [rule, `${expression} = ${n(value)}`],
    };
  },
});
