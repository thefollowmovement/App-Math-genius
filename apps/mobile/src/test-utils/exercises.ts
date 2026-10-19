import {
  generateExercise,
  generators,
  type Exercise,
  type ExerciseType,
} from '@math-genius/exercise-engine';

/** A real exercise of the given type, the same at every run. */
export function exerciseOfType<T extends ExerciseType>(type: T): Extract<Exercise, { type: T }> {
  for (const generator of generators) {
    const exercise = generateExercise(generator, 2, 3);
    if (exercise.type === type) return exercise as Extract<Exercise, { type: T }>;
  }
  throw new Error(`No generator makes ${type} exercises`);
}

export const EXERCISE_TYPES: readonly ExerciseType[] = [
  'numeric',
  'choice',
  'true-false',
  'number-line',
  'order',
  'match',
  'fraction-shade',
];
