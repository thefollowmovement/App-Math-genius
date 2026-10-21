import {
  type CoachFrame,
  type Explanation,
  type ExplanationProblem,
  explanationProblems,
  renderExplanation,
} from '@math-genius/exercise-engine';

/**
 * Automatic checks of a generated explanation (docs/specs.md, Coach IA : contrôles automatiques):
 * the engine's (numbers only through the exercise's slots, under 60 words), the banned words, and
 * the moderation model's verdict. Any problem: the child sees the generator's own correction.
 */

export type CheckProblem = ExplanationProblem | 'unreadable' | 'banned-word' | 'moderation';

/** The three parts from the model's answer, JSON possibly wrapped in a code block. */
export function parseExplanation(text: string): Explanation | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let value: unknown;
  try {
    value = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const { what, image, tip } = value as Record<string, unknown>;
  if (typeof what !== 'string' || typeof image !== 'string' || typeof tip !== 'string') return null;
  return { what: what.trim(), image: image.trim(), tip: tip.trim() };
}

const normalize = (text: string) =>
  text.toLocaleLowerCase('fr').normalize('NFD').replace(/\p{M}/gu, '');

/** The banned words (whole words, accents and case aside) the text contains. */
export function bannedWordsIn(text: string, banned: readonly string[]): string[] {
  const words = new Set(normalize(text).split(/[^\p{L}\p{N}'’-]+/u));
  const plain = normalize(text);
  return banned.filter((word) => {
    const term = normalize(word.trim());
    if (!term) return false;
    // A phrase is looked for as is, a single word among the words.
    return term.includes(' ') ? plain.includes(term) : words.has(term);
  });
}

export type CheckResult = { problems: CheckProblem[]; rendered: Explanation | null };

/** Checks that need no network; the moderation model comes after (moderationProblems). */
export function checkExplanation(
  template: Explanation | null,
  frame: CoachFrame,
  banned: readonly string[],
): CheckResult {
  if (!template) return { problems: ['unreadable'], rendered: null };
  const problems: CheckProblem[] = explanationProblems(template, frame);
  const rendered = renderExplanation(template, frame.slots);
  const text = [template.what, template.image, template.tip].join(' ');
  if (bannedWordsIn(text, banned).length > 0) problems.push('banned-word');
  return { problems, rendered: problems.length === 0 ? rendered : null };
}

export const explanationText = (explanation: Explanation) =>
  [explanation.what, explanation.image, explanation.tip].join('\n');
