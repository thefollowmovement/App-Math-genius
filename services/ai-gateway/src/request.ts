import {
  type Exercise,
  type ExerciseResponse,
  parseStoredResponse,
  rebuildExercise,
} from '@math-genius/exercise-engine';

/**
 * What the app sends after a mistake: the exercise by its generator, difficulty and seed (the
 * server builds it again, the exercise's text never travels) and the child's answer.
 */
export type CoachRequest = {
  childId: string;
  exercise: Exercise;
  response: ExerciseResponse;
  /** Explanations already shown for this mistake. */
  exclude: string[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_EXCLUDED = 10;

export function parseCoachRequest(body: unknown): CoachRequest | null {
  if (typeof body !== 'object' || body === null) return null;
  const fields = body as Record<string, unknown>;
  const { child_id: childId, generator_id: generatorId, difficulty, seed, response } = fields;
  if (typeof childId !== 'string' || !UUID.test(childId)) return null;
  if (typeof generatorId !== 'string' || typeof difficulty !== 'number') return null;
  if (typeof seed !== 'number' || !Number.isInteger(seed) || seed < 0) return null;
  const exercise = rebuildExercise({ generator_id: generatorId, difficulty, seed });
  const answer = parseStoredResponse(response);
  if (!exercise || !answer || answer.type !== exercise.type) return null;
  const exclude = Array.isArray(fields.exclude)
    ? fields.exclude.filter((id): id is string => typeof id === 'string' && UUID.test(id))
    : [];
  return { childId, exercise, response: answer, exclude: exclude.slice(0, MAX_EXCLUDED) };
}
