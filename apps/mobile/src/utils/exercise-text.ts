import {
  formatAnswer,
  type Exercise,
  type NumberForm,
  type Verdict,
} from '@math-genius/exercise-engine';

import { strings } from '@/i18n';

const t = strings.practice;

/** The expected answer, written for the feedback after a wrong answer. */
export function rightAnswerText(exercise: Exercise): string {
  switch (exercise.type) {
    case 'numeric':
      return [formatAnswer(exercise), exercise.unit].filter(Boolean).join(' ');
    case 'choice':
      return exercise.options[exercise.answer]?.label ?? '';
    case 'true-false':
      return exercise.answer ? t.trueLabel : t.falseLabel;
    case 'number-line':
      return exercise.target;
    case 'order': {
      const separator = exercise.direction === 'ascending' ? ' < ' : ' > ';
      return exercise.answer.map((index) => exercise.items[index]).join(separator);
    }
    case 'match':
      return exercise.left
        .map((label, index) => `${label} → ${exercise.right[exercise.answer[index] ?? 0]}`)
        .join('\n');
    case 'fraction-shade':
      return t.shade.answer(exercise.answer, exercise.parts);
  }
}

const FORM_PRIORITY: readonly NumberForm[] = ['fraction', 'decimal', 'integer'];

/**
 * Message for an answer that cannot be graded as is: unreadable, or the right value written in
 * the wrong form. The child can correct it; nothing is recorded. Null for a real verdict.
 */
export function retryNotice(exercise: Exercise, verdict: Verdict): string | null {
  if (verdict.correct || verdict.reason === 'incorrect') return null;
  if (verdict.reason === 'unreadable') return t.unreadable;
  if (verdict.reason === 'not-irreducible') return t.notIrreducible;
  const forms = exercise.type === 'numeric' ? exercise.forms : undefined;
  const expected = FORM_PRIORITY.find((form) => forms?.includes(form)) ?? 'fraction';
  return t.forms[expected];
}
