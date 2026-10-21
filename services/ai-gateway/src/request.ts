import {
  type ErrorTypeCode,
  type SkillCode,
  isErrorTypeCode,
  isSkillCode,
} from '@math-genius/curriculum';
import {
  type Exercise,
  type ExerciseResponse,
  parseStoredResponse,
  rebuildExercise,
} from '@math-genius/exercise-engine';
import { GRADE_BANDS, type GradeBand } from '@math-genius/shared';

import type { PromptTemplate } from './prompt';

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

/** What the back-office sends to try a prompt (Prompts, « test en direct »). */
export type PreviewRequest = {
  skill: SkillCode;
  error: ErrorTypeCode | null;
  universe: string | null;
  band: GradeBand;
  prompt: PromptTemplate;
  night: boolean;
};

const MAX_PROMPT_LENGTH = 8000;
const promptText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() && value.length <= MAX_PROMPT_LENGTH ? value : null;

export function parsePreviewRequest(body: unknown): PreviewRequest | null {
  if (typeof body !== 'object' || body === null) return null;
  const { skill, error, universe, band, system, user, version, night } = body as Record<
    string,
    unknown
  >;
  if (typeof skill !== 'string' || !isSkillCode(skill)) return null;
  if (error != null && (typeof error !== 'string' || !isErrorTypeCode(error))) return null;
  if (universe != null && typeof universe !== 'string') return null;
  const ageGroup = GRADE_BANDS.find((item) => item === band);
  const systemText = promptText(system);
  const userText = promptText(user);
  if (!ageGroup || !systemText || !userText) return null;
  return {
    skill,
    error: error ?? null,
    universe: universe || null,
    band: ageGroup,
    prompt: {
      version:
        typeof version === 'number' && Number.isInteger(version) && version > 0 ? version : 0,
      system: systemText,
      user: userText,
    },
    night: night === true,
  };
}
