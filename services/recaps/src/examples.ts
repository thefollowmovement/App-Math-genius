import {
  answerText,
  givenText,
  isSkippedAnswer,
  parseStoredResponse,
  rebuildExercise,
} from '@math-genius/exercise-engine';
import type { BlockingPoint } from '@math-genius/shared';

/** A real mistake, as the parent reads it: the exercise, the child's answer, the right one. */
export type ShownMistake = {
  prompt: string;
  given: string;
  expected: string;
  mistake: string | null;
};

/**
 * The exercise behind a point of difficulty's example, rebuilt by the engine from its generator,
 * difficulty and seed (exercise texts are never stored). Null when this version of the engine no
 * longer knows the generator, or the stored answer cannot be read.
 */
export function shownMistake(point: BlockingPoint): ShownMistake | null {
  const example = point.example;
  if (!example || isSkippedAnswer(example.answer)) return null;
  const exercise = rebuildExercise({
    generator_id: example.generatorId,
    difficulty: example.difficulty,
    seed: example.seed,
  });
  const response = parseStoredResponse(example.answer);
  if (!exercise || !response) return null;
  return {
    prompt: exercise.prompt,
    given: givenText(exercise, response),
    expected: answerText(exercise),
    mistake: example.errorLabel ?? point.errorLabel,
  };
}
