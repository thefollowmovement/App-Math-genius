import { defineGenerator } from '../kit';

const NATURES = ['aigu', 'droit', 'obtus', 'plat'] as const;
const REASONS = {
  aigu: (measure: number) => `${measure}° est moins que 90°`,
  droit: () => 'Il mesure exactement 90°',
  obtus: (measure: number) => `${measure}° est entre 90° et 180°`,
  plat: () => 'Il mesure exactement 180°',
};

export default defineGenerator({
  skill: '6e.angles-degres',
  generate(rng, difficulty) {
    // From difficulty 3, measures come close to 90° and 180°, where mistakes happen.
    const near = Math.min(180, rng.pick([90, 180]) + rng.int(-6 * difficulty, 6));
    const spread =
      difficulty === 1 ? rng.pick([30, 45, 60, 90, 120, 135, 150, 180]) : 10 * rng.int(1, 18);
    const measure = difficulty < 3 ? spread : near;
    const nature =
      measure < 90 ? 'aigu' : measure === 90 ? 'droit' : measure < 180 ? 'obtus' : 'plat';
    return {
      type: 'choice',
      prompt: `Un angle mesure ${measure}°. Cet angle est :`,
      options: NATURES.map((label) => ({ label, check: `${label}(${measure})` })),
      answer: NATURES.indexOf(nature),
      mistakes: {
        'acute-obtuse': [{ aigu: 2, obtus: 0, droit: undefined, plat: undefined }[nature]],
      },
      hint: 'Compare la mesure à 90° (angle droit) et à 180° (angle plat).',
      explanation: [`${REASONS[nature](measure)} : l’angle est ${nature}.`],
    };
  },
});
