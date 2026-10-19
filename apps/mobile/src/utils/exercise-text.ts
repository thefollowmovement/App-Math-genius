import {
  formatAnswer,
  formatFraction,
  formatNumber,
  type Exercise,
  type ExerciseResponse,
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

/** What the child answered, written like the right answer so the parent can compare them. */
export function responseText(exercise: Exercise, response: ExerciseResponse): string {
  switch (response.type) {
    case 'numeric':
      return [response.text, exercise.type === 'numeric' ? exercise.unit : undefined]
        .filter(Boolean)
        .join(' ');
    case 'choice':
      return exercise.type === 'choice' ? (exercise.options[response.index]?.label ?? '') : '';
    case 'true-false':
      return response.value ? t.trueLabel : t.falseLabel;
    case 'number-line':
      // Written as a fraction when the number to place was one.
      return exercise.type === 'number-line' && exercise.target.includes('/')
        ? formatFraction(response.value.num, response.value.den)
        : formatNumber(response.value);
    case 'order': {
      if (exercise.type !== 'order') return '';
      const separator = exercise.direction === 'ascending' ? ' < ' : ' > ';
      return response.order.map((index) => exercise.items[index]).join(separator);
    }
    case 'match':
      if (exercise.type !== 'match') return '';
      return exercise.left
        .map((label, index) => `${label} → ${exercise.right[response.pairs[index] ?? 0]}`)
        .join('\n');
    case 'fraction-shade':
      return exercise.type === 'fraction-shade'
        ? t.shade.answer(response.shaded, exercise.parts)
        : '';
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
