import { defineGenerator, frac, list, r } from '../kit';

const COLORS = ['rouges', 'bleues', 'vertes', 'jaunes'];

export default defineGenerator({
  skill: '6e.probabilites',
  generate(rng, difficulty) {
    const colors = rng.sample(COLORS, difficulty < 3 ? 2 : 3);
    const counts = colors.map(() => rng.int(2, difficulty < 4 ? 6 : 12));
    const target = rng.int(0, colors.length - 1);
    const total = counts.reduce((sum, count) => sum + count, 0);
    const favourable = counts[target] ?? 0;
    const content = colors.map((color, index) => `${counts[index]} boules ${color}`);
    return {
      type: 'numeric',
      prompt: `Un sac contient ${list(content)}. On tire une boule au hasard. Quelle est la probabilité qu’elle soit ${colors[target]?.slice(0, -1)} ?`,
      check: `${favourable} ÷ (${counts.join(' + ')})`,
      answer: r(favourable, total),
      display: 'fraction',
      hint: 'Probabilité = nombre de cas favorables ÷ nombre total de cas.',
      explanation: [
        `Il y a ${total} boules, dont ${favourable} ${colors[target]}.`,
        `La probabilité est ${frac(favourable, total)}.`,
      ],
    };
  },
});
