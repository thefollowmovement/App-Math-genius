import { defineGenerator, n, op } from '../kit';

export default defineGenerator({
  skill: '5e.tester-egalite',
  generate(rng, difficulty) {
    const [a, b] = [rng.int(2, 9), rng.int(1, 5 * difficulty)];
    // From difficulty 3, x can be negative.
    const x = rng.int(difficulty < 3 ? 1 : -9, 9) || 1;
    const value = a * x + b;
    const truth = rng.chance(0.5);
    const right = truth ? value : value + rng.pick([-2, -1, 1, 2]);
    return {
      type: 'true-false',
      prompt: `L’égalité ${a}x + ${b} = ${n(right)} est-elle vraie pour x = ${n(x)} ?`,
      check: `${a} × ${op(x)} + ${b} = ${op(right)}`,
      answer: truth,
      hint: `Remplace x par ${n(x)}, puis calcule le membre de gauche.`,
      explanation: [
        `${a} × ${op(x)} + ${b} = ${n(value)}`,
        truth
          ? `On trouve bien ${n(right)} : l’égalité est vraie.`
          : `${n(value)} n’est pas égal à ${n(right)} : l’égalité est fausse.`,
      ],
    };
  },
});
