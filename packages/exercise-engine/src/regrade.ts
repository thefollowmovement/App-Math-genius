import { buildExercise } from './adaptive/planner';
import { DIFFICULTIES, type Exercise } from './exercise';
import { type ExerciseResponse, gradeResponse } from './grade';
import { rational } from './rational';

/**
 * Server-side grading: the server rebuilds each exercise from its generator, difficulty and seed
 * and grades the stored answer again, rather than trusting what the device said. XP and gems are
 * only awarded on these verdicts (supabase/functions/award-session).
 */

/** An answer as the attempts table stores it. */
export type StoredAnswer = {
  position: number;
  generator_id: string;
  difficulty: number;
  seed: number;
  answer: unknown;
};

/** Null: this version of the engine cannot rebuild the exercise (unknown generator). */
export type ServerVerdict = { position: number; correct: boolean | null };

type JsonObject = { [key: string]: unknown };

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumberList = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'number');

/** The answer stored with an attempt, if it has a known shape. */
export function parseStoredResponse(value: unknown): ExerciseResponse | null {
  if (!isObject(value)) return null;
  const { type } = value;
  if (type === 'numeric' && typeof value.text === 'string') return { type, text: value.text };
  if (type === 'choice' && typeof value.index === 'number') return { type, index: value.index };
  if (type === 'true-false' && typeof value.value === 'boolean') {
    return { type, value: value.value };
  }
  if (type === 'number-line' && isObject(value.value)) {
    const { num, den } = value.value;
    if (typeof num === 'number' && typeof den === 'number' && den !== 0) {
      return { type, value: rational(num, den) };
    }
  }
  if (type === 'order' && isNumberList(value.order)) return { type, order: value.order };
  if (type === 'match' && isNumberList(value.pairs)) return { type, pairs: value.pairs };
  if (type === 'fraction-shade' && typeof value.shaded === 'number') {
    return { type, shaded: value.shaded };
  }
  return null;
}

/** The exercise behind a stored answer; null if this engine no longer knows its generator. */
export function rebuildExercise(
  stored: Pick<StoredAnswer, 'generator_id' | 'difficulty' | 'seed'>,
): Exercise | null {
  const difficulty = DIFFICULTIES.find((level) => level === stored.difficulty);
  if (!difficulty) return null;
  try {
    return buildExercise({ generatorId: stored.generator_id, difficulty, seed: stored.seed });
  } catch {
    return null;
  }
}

/** Grades every stored answer again. An answer of an unknown shape is wrong. */
export function regrade(answers: readonly StoredAnswer[]): ServerVerdict[] {
  return answers.map(({ position, ...stored }) => {
    const exercise = rebuildExercise(stored);
    if (!exercise) return { position, correct: null };
    const response = parseStoredResponse(stored.answer);
    return { position, correct: response ? gradeResponse(exercise, response).correct : false };
  });
}
