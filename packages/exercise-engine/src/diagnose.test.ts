import { ERROR_TYPES, getErrorType } from '@math-genius/curriculum';

import { diagnoseResponse, mistakeList } from './diagnose';
import { DIFFICULTIES } from './exercise';
import { generateExercise, generatorId } from './generator';
import {
  afterCommaKey,
  leftToRight,
  misalignedSum,
  noCarryProduct,
  noCarrySum,
} from './generators/helpers';
import { generators } from './generators';
import { gradeResponse } from './grade';
import { formatNumber } from './format';
import { add, decimal, rational } from './rational';
import { responseWith, rightResponse } from './testing/responses';

const DRAWS = 300;

describe('typical mistakes', () => {
  // Pairs (generator's skill, error code) met in the draws.
  const seen = new Set<string>();

  it.each(generators.map((generator) => [generatorId(generator), generator] as const))(
    '%s: each typical mistake is wrong and diagnosed as such',
    (_id, generator) => {
      for (const difficulty of DIFFICULTIES) {
        for (let draw = 0; draw < DRAWS; draw++) {
          const exercise = generateExercise(generator, difficulty, draw * 7919 + difficulty);
          for (const { error, answer } of mistakeList(exercise)) {
            const skills: readonly string[] = getErrorType(error).skills;
            expect({ error, skill: skills.includes(exercise.skill) }).toEqual({
              error,
              skill: true,
            });
            const response = responseWith(exercise, answer);
            expect(gradeResponse(exercise, response).correct).toBe(false);
            // Two mistakes may give the same wrong answer: any of them explains it.
            const same = mistakeList(exercise)
              .filter((other) => JSON.stringify(other.answer) === JSON.stringify(answer))
              .map((other) => other.error);
            expect(same).toContain(diagnoseResponse(exercise, response));
            seen.add(`${exercise.skill} ${error}`);
          }
          expect(diagnoseResponse(exercise, rightResponse(exercise))).toBeNull();
        }
      }
    },
  );

  it('meets every mistake of the catalogue on each of its skills', () => {
    const declared = ERROR_TYPES.flatMap(({ code, skills }) =>
      skills.map((skill) => `${skill} ${code}`),
    );
    expect(declared.filter((pair) => !seen.has(pair))).toEqual([]);
  });
});

describe('diagnosing a wrong answer', () => {
  const additions = generators.find((generator) => generator.skill === 'ce2.addition-posee');
  if (!additions) throw new Error('no addition generator');

  it('names the mistake behind an answer, and nothing for another wrong one', () => {
    // 47 + 38 at difficulty 1 (no carry needed on every draw: take one that has one).
    const exercise = Array.from({ length: 200 }, (_, seed) =>
      generateExercise(additions, 3, seed),
    ).find((candidate) => mistakeList(candidate).length > 0);
    if (!exercise || exercise.type !== 'numeric') throw new Error('no addition with a carry');
    const [mistake] = mistakeList(exercise);
    expect(diagnoseResponse(exercise, responseWith(exercise, mistake?.answer))).toBe(
      'forgot-carry',
    );
    const offByOne = {
      type: 'numeric',
      text: formatNumber(add(exercise.answer, rational(1))),
    } as const;
    expect(diagnoseResponse(exercise, offByOne)).toBeNull();
  });

  it('computes what a child making the mistake finds', () => {
    expect(noCarrySum(47, 38)).toBe(75);
    expect(noCarrySum(1205, 896)).toBe(1091);
    expect(noCarryProduct(47, 3)).toBe(21);
    expect(leftToRight('2 + 3 × 4')).toEqual(rational(20));
    expect(leftToRight('(2 + 3) × 4')).toEqual(rational(20));
    expect(misalignedSum(decimal(35, 1), decimal(125, 2))).toEqual(decimal(160, 2));
    // 2,5 against 2,15: read as 5 and 15.
    expect(afterCommaKey('2,5')).toBeLessThan(afterCommaKey('2,15'));
  });
});
