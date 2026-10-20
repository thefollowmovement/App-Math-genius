import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { DIFFICULTIES } from '../exercise';
import { generateExercise, generatorId } from '../generator';
import { auditExercise, exerciseKey } from '../testing/audit';

import { generators } from '.';

const DRAWS = 1000;

/**
 * A generator's source without its `mistakes: …,` properties: the typical mistakes are optional
 * (the diagnosis of a wrong answer), the exercise itself stays under 30 lines.
 */
function withoutMistakes(source: string): string {
  let rest = source;
  for (let start = rest.indexOf('mistakes:'); start >= 0; start = rest.indexOf('mistakes:')) {
    let depth = 0;
    let end = start;
    for (; end < rest.length; end++) {
      const char = rest[end];
      if (char === '{' || char === '[' || char === '(') depth++;
      else if (char === '}' || char === ']' || char === ')') depth--;
      else if (char === ',' && depth === 0) break;
    }
    rest = rest.slice(0, start) + rest.slice(end + 1);
  }
  return rest;
}
const GRADE_FOLDERS = ['ce2', 'cm1', 'cm2', 'sixieme', 'cinquieme'];

describe('generator registry', () => {
  it('has at least 30 generators with unique ids', () => {
    const ids = generators.map(generatorId);
    expect(ids.length).toBeGreaterThanOrEqual(30);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every exercise type', () => {
    const types = new Set(generators.map((generator) => generateExercise(generator, 3, 1).type));
    expect([...types].sort()).toEqual(
      ['choice', 'fraction-shade', 'match', 'number-line', 'numeric', 'order', 'true-false'].sort(),
    );
  });

  it('registers every generator file, each under 30 lines of code, typical mistakes aside', () => {
    const files = GRADE_FOLDERS.flatMap((folder) =>
      readdirSync(join(__dirname, folder)).map((file) => join(__dirname, folder, file)),
    );
    expect(files).toHaveLength(generators.length);
    for (const file of files) {
      const lines = withoutMistakes(readFileSync(file, 'utf8'))
        .split('\n')
        .filter((line) => line.trim() !== '');
      expect({ file, lines: lines.length < 30 }).toEqual({ file, lines: true });
    }
  });
});

describe.each(generators.map((generator) => [generatorId(generator), generator] as const))(
  '%s',
  (_id, generator) => {
    it.each(DIFFICULTIES)('difficulty %i: 1 000 draws, no wrong answer', (difficulty) => {
      const counts = new Map<string, number>();
      for (let draw = 0; draw < DRAWS; draw++) {
        const seed = draw * 7919 + difficulty;
        const exercise = generateExercise(generator, difficulty, seed);
        let problems: string[];
        try {
          problems = auditExercise(exercise);
        } catch (error) {
          problems = [String(error)];
        }
        if (problems.length > 0) {
          throw new Error(
            `seed ${seed}: ${problems.join(' ; ')}\n${JSON.stringify(exercise, null, 2)}`,
          );
        }
        const key = exerciseKey(exercise);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      // No trivial duplicates: draws vary and no single exercise keeps coming back.
      expect(counts.size).toBeGreaterThanOrEqual(5);
      expect(Math.max(...counts.values())).toBeLessThanOrEqual(DRAWS / 4);
    });

    it('rebuilds the same exercise from the same seed', () => {
      for (const difficulty of DIFFICULTIES) {
        expect(generateExercise(generator, difficulty, 42)).toEqual(
          generateExercise(generator, difficulty, 42),
        );
      }
    });
  },
);
