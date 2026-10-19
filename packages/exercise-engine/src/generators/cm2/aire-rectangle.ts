import { defineGenerator, n, r } from '../kit';

const SIDES = { 1: [2, 9], 2: [3, 12], 3: [5, 25], 4: [10, 60], 5: [12, 120] } as const;

export default defineGenerator({
  skill: 'cm2.aire-rectangle',
  generate(rng, difficulty) {
    const [min, max] = SIDES[difficulty];
    const unit = rng.pick(['cm', 'm']);
    const length = rng.int(min + 1, max);
    const width = rng.int(min, length - 1);
    const square = rng.chance(0.25);
    const [l, w] = [n(length), n(width)];
    return {
      type: 'numeric',
      prompt: square
        ? `Quelle est l’aire d’un carré de ${l} ${unit} de côté ?`
        : `Quelle est l’aire d’un rectangle de ${l} ${unit} sur ${w} ${unit} ?`,
      check: square ? `aire_carre(${l})` : `aire_rectangle(${l}, ${w})`,
      answer: r(square ? length * length : length * width),
      unit: `${unit}²`,
      hint: 'L’aire d’un rectangle, c’est la longueur multipliée par la largeur.',
      explanation: [
        square
          ? `${l} × ${l} = ${n(length * length)} ${unit}²`
          : `${l} × ${w} = ${n(length * width)} ${unit}²`,
      ],
    };
  },
});
