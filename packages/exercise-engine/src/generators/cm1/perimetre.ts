import { defineGenerator, n, r } from '../kit';

const MAX = { 1: 10, 2: 20, 3: 50, 4: 99, 5: 250 };

export default defineGenerator({
  skill: 'cm1.perimetre',
  generate(rng, difficulty) {
    const length = rng.int(3, MAX[difficulty]);
    const width = rng.int(2, length - 1);
    const square = rng.chance(0.3);
    const [l, w] = [n(length), n(width)];
    return {
      type: 'numeric',
      prompt: square
        ? `Quel est le périmètre d’un carré de ${l} cm de côté ?`
        : `Quel est le périmètre d’un rectangle de ${l} cm de longueur et ${w} cm de largeur ?`,
      check: square ? `perimetre_carre(${l})` : `perimetre_rectangle(${l}, ${w})`,
      answer: r(square ? 4 * length : 2 * (length + width)),
      unit: 'cm',
      hint: 'Le périmètre, c’est la longueur du tour de la figure.',
      explanation: [
        square
          ? `${l} + ${l} + ${l} + ${l} = ${n(4 * length)} cm`
          : `${l} + ${w} + ${l} + ${w} = ${n(2 * (length + width))} cm`,
      ],
    };
  },
});
