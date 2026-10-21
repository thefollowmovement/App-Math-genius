import type { CoachFrame } from './frame';
import { foreignNumbers } from './numbers';

/**
 * A coach's explanation (docs/specs.md, Format d'une explication): what happened, the picture that
 * makes it clear (from the child's universe), and the tip to remember; under 60 words in all.
 * Written once as a template, with slots for every number ({n1}, {e1}, {reponse}, {solution}),
 * then shown for any exercise of the skill with that exercise's own numbers.
 */
export type Explanation = { what: string; image: string; tip: string };

export const EXPLANATION_PARTS = [
  'what',
  'image',
  'tip',
] as const satisfies readonly (keyof Explanation)[];
export const MAX_EXPLANATION_WORDS = 60;
const MAX_PART_LENGTH = 280;

export type ExplanationProblem =
  /** A template writes numbers only through slots. */
  | 'digits'
  /** Numbers in words would escape the check (« trois », « vingt »). */
  | 'number-words'
  /** A slot this exercise does not have. */
  | 'unknown-slot'
  | 'empty'
  | 'too-long'
  /** Shown, a number that is neither in the exercise nor in its correction. */
  | 'foreign-number';

const SLOT = /\{([a-z]+\d*)\}/g;
const DIGIT = /[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]/;
const NUMBER_WORDS = new RegExp(
  `(?<!\\p{L})(${[
    'deux',
    'trois',
    'quatre',
    'cinq',
    'six',
    'sept',
    'huit',
    'neuf',
    'dix',
    'onze',
    'douze',
    'treize',
    'quatorze',
    'quinze',
    'seize',
    'vingts?',
    'trente',
    'quarante',
    'cinquante',
    'soixante',
    'cents?',
    'milles?',
    'millions?',
    'milliards?',
  ].join('|')})(?!\\p{L})`,
  'iu',
);

const parts = (explanation: Explanation) => EXPLANATION_PARTS.map((part) => explanation[part]);

export const wordCount = (explanation: Explanation) =>
  parts(explanation).join(' ').split(/\s+/).filter(Boolean).length;

/** The template with the exercise's numbers in place; null if it uses a slot the exercise lacks. */
export function renderExplanation(
  template: Explanation,
  slots: Readonly<Record<string, string>>,
): Explanation | null {
  let missing = false;
  const fill = (text: string) =>
    text.replace(SLOT, (_, name: string) => {
      const value = slots[name];
      if (value === undefined) missing = true;
      return value ?? '';
    });
  const rendered = {
    what: fill(template.what),
    image: fill(template.image),
    tip: fill(template.tip),
  };
  return missing ? null : rendered;
}

/** Why a template cannot be shown for this exercise; none: it can. */
export function explanationProblems(
  template: Explanation,
  frame: CoachFrame,
): ExplanationProblem[] {
  const problems = new Set<ExplanationProblem>();
  for (const text of parts(template)) {
    if (text.trim().length === 0) problems.add('empty');
    if (text.length > MAX_PART_LENGTH) problems.add('too-long');
    const bare = text.replace(SLOT, '');
    if (DIGIT.test(bare)) problems.add('digits');
    if (NUMBER_WORDS.test(bare)) problems.add('number-words');
    if (/[{}]/.test(bare)) problems.add('unknown-slot');
  }
  const rendered = renderExplanation(template, frame.slots);
  if (!rendered) {
    problems.add('unknown-slot');
  } else {
    if (wordCount(rendered) > MAX_EXPLANATION_WORDS) problems.add('too-long');
    if (parts(rendered).some((text) => foreignNumbers(text, frame.allowed).length > 0)) {
      problems.add('foreign-number');
    }
  }
  return [...problems];
}

/** The explanation to show for this exercise, or null: the generator's own correction instead. */
export function showableExplanation(template: Explanation, frame: CoachFrame): Explanation | null {
  return explanationProblems(template, frame).length === 0
    ? renderExplanation(template, frame.slots)
    : null;
}
