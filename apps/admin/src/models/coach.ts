import {
  ERROR_TYPES,
  getErrorType,
  getSkill,
  isErrorTypeCode,
  isSkillCode,
  type ErrorTypeCode,
  type SkillCode,
} from '@math-genius/curriculum';
import {
  coachFrame,
  coachSample,
  generators,
  renderExplanation,
  showableExplanation,
  type Explanation,
} from '@math-genius/exercise-engine';

/** The skills the coach can explain: those with exercises, in the referential's order. */
export const coachSkills = (): { code: SkillCode; title: string }[] =>
  [...new Set(generators.map((generator) => generator.skill))].map((code) => ({
    code,
    title: getSkill(code).title,
  }));

/** The typical mistakes of a skill. */
export const skillErrors = (skill: SkillCode) =>
  ERROR_TYPES.filter((error) => (error.skills as readonly string[]).includes(skill));

export const skillTitle = (code: string) => (isSkillCode(code) ? getSkill(code).title : code);
export const errorLabel = (code: string | null) =>
  code !== null && isErrorTypeCode(code) ? getErrorType(code).label : null;

export const EXPLANATION_PARTS = ['what', 'image', 'tip'] as const;

export function readExplanation(value: unknown): Explanation | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const { what, image, tip } = value as Record<string, unknown>;
  return typeof what === 'string' && typeof image === 'string' && typeof tip === 'string'
    ? { what, image, tip }
    : null;
}

/**
 * A stored explanation as a child would see it, on an exercise of the same skill that shows the
 * same mistake (the engine's own sample); `showable` says whether the checks let it through.
 */
export function explanationExample(
  template: Explanation,
  skill: string,
  error: string | null,
): { exercise: string; explanation: Explanation; showable: boolean } | null {
  if (!isSkillCode(skill)) return null;
  const mistake: ErrorTypeCode | null = error !== null && isErrorTypeCode(error) ? error : null;
  const sample = coachSample(skill, mistake);
  if (!sample) return null;
  const frame = coachFrame(sample.exercise, sample.response);
  const showable = showableExplanation(template, frame);
  const explanation = showable ?? renderExplanation(template, frame.slots);
  return explanation
    ? { exercise: sample.exercise.prompt, explanation, showable: showable !== null }
    : null;
}

/** The share of displays after which the child said « J'ai compris ». */
export const understoodRate = (understood: number, shown: number) =>
  shown === 0 ? null : understood / shown;
