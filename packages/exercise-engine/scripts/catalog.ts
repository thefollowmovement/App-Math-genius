// Prints sample exercises of every generator as Markdown, for a teacher to review.
// Usage: pnpm --filter @math-genius/exercise-engine catalog > catalogue.md
import { getSkill } from '@math-genius/curriculum';

import {
  DIFFICULTIES,
  type Exercise,
  formatAnswer,
  formatFraction,
  formatNumber,
  generateExercise,
  generatorId,
  generators,
} from '../src';

const SAMPLES_PER_DIFFICULTY = 3;

function answerText(exercise: Exercise): string {
  switch (exercise.type) {
    case 'numeric':
      return `${formatAnswer(exercise)}${exercise.unit ? ` ${exercise.unit}` : ''}`;
    case 'choice':
      return exercise.options[exercise.answer]?.label ?? '?';
    case 'true-false':
      return exercise.answer ? 'Vrai' : 'Faux';
    case 'number-line':
      return `${exercise.target} sur une droite de ${formatNumber(exercise.min)} à ${formatNumber(exercise.max)}, graduée tous les ${formatFraction(exercise.step.num, exercise.step.den)}`;
    case 'order':
      return exercise.answer
        .map((index) => exercise.items[index])
        .join(exercise.direction === 'ascending' ? ' < ' : ' > ');
    case 'match':
      return exercise.answer
        .map((right, left) => `${exercise.left[left]} ↔ ${exercise.right[right]}`)
        .join(' ; ');
    case 'fraction-shade':
      return `${exercise.answer} part(s) sur ${exercise.parts}`;
  }
}

function details(exercise: Exercise): string {
  if (exercise.type === 'choice')
    return ` — choix : ${exercise.options.map((option) => option.label).join(' / ')}`;
  if (exercise.type === 'order') return ` — nombres : ${exercise.items.join(' ; ')}`;
  if (exercise.type === 'match')
    return ` — à relier : ${exercise.left.join(', ')} | ${exercise.right.join(', ')}`;
  return '';
}

const lines = [
  '# Catalogue des exercices générés',
  '',
  `${generators.length} générateurs, ${SAMPLES_PER_DIFFICULTY} exemples par difficulté (1 à 5).`,
  '',
];

for (const generator of generators) {
  const skill = getSkill(generator.skill);
  lines.push(
    `## ${skill.grade} — ${skill.title}`,
    '',
    `Générateur \`${generatorId(generator)}\``,
    '',
  );
  for (const difficulty of DIFFICULTIES) {
    lines.push(`### Difficulté ${difficulty}`, '');
    for (let sample = 1; sample <= SAMPLES_PER_DIFFICULTY; sample++) {
      const exercise = generateExercise(generator, difficulty, sample * 1009 + difficulty);
      lines.push(
        `- **${exercise.prompt}**${details(exercise)}`,
        `  - Réponse : ${answerText(exercise)}`,
        `  - Indice : ${exercise.hint}`,
        `  - Explication : ${exercise.explanation.join(' / ')}`,
      );
    }
    lines.push('');
  }
}

process.stdout.write(`${lines.join('\n')}\n`);
