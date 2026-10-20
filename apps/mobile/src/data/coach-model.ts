import {
  coachFrame,
  showableExplanation,
  type Exercise,
  type ExerciseResponse,
  type Explanation,
} from '@math-genius/exercise-engine';

/** An explanation of the coach, ready to show: its numbers are this exercise's. */
export type CoachExplanation = { id: string; explanation: Explanation };

/** What the ai-gateway Edge Function needs after a mistake: the exercise travels as its seed. */
export function coachRequest(
  childId: string,
  exercise: Exercise,
  response: ExerciseResponse,
  exclude: readonly string[],
) {
  return {
    task: 'explain',
    child_id: childId,
    generator_id: exercise.generatorId,
    difficulty: exercise.difficulty,
    seed: exercise.seed,
    response,
    exclude,
  };
}

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The gateway's answer, or null for the generator's own correction. The text the server rendered
 * is never shown: the template is rendered here with this exercise's numbers and checked again by
 * the engine (numbers of the exercise and its correction only, length, slots), so every number
 * shown comes from the code.
 */
export function coachExplanation(
  value: unknown,
  exercise: Exercise,
  response: ExerciseResponse,
): CoachExplanation | null {
  if (!isRow(value) || (value.source !== 'cache' && value.source !== 'ai')) return null;
  const { id, template } = value;
  if (typeof id !== 'string' || !isRow(template)) return null;
  const { what, image, tip } = template;
  if (typeof what !== 'string' || typeof image !== 'string' || typeof tip !== 'string') return null;
  const explanation = showableExplanation({ what, image, tip }, coachFrame(exercise, response));
  return explanation ? { id, explanation } : null;
}
