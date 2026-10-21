import type { ErrorTypeCode, SkillCode } from '@math-genius/curriculum';

import { DIFFICULTIES, type Exercise } from '../exercise';
import { type Generator, generateExercise } from '../generator';
import { generators as allGenerators } from '../generators';
import { diagnoseResponse, mistakeList } from '../diagnose';
import { type ExerciseResponse, gradeResponse } from '../grade';
import { responseWith } from '../respond';
import { wrongAnswer } from './wrong';

/** Draws tried per difficulty to find an exercise where the mistake shows. */
const SEEDS = 200;
// The year's basics first, then the others.
const ORDER = [2, 3, 1, 4, 5] as const;

/**
 * An exercise of the skill and a wrong answer behind `error` (or, without one, a wrong answer the
 * engine cannot explain): what the night's pre-generation writes an explanation for. The same
 * arguments always give the same sample.
 */
export function coachSample(
  skill: SkillCode,
  error: ErrorTypeCode | null,
  generators: readonly Generator[] = allGenerators,
): { exercise: Exercise; response: ExerciseResponse } | null {
  const own = generators.filter((generator) => generator.skill === skill);
  for (const difficulty of ORDER.filter((level) => DIFFICULTIES.includes(level))) {
    for (const generator of own) {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const exercise = generateExercise(generator, difficulty, seed);
        const response = error ? mistakenResponse(exercise, error) : wrongAnswer(exercise);
        if (response && !gradeResponse(exercise, response).correct) {
          if (diagnoseResponse(exercise, response) === error) return { exercise, response };
        }
      }
    }
  }
  return null;
}

function mistakenResponse(exercise: Exercise, error: ErrorTypeCode): ExerciseResponse | null {
  const mistake = mistakeList(exercise).find((item) => item.error === error);
  return mistake ? responseWith(exercise, mistake.answer) : null;
}
