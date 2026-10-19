import type { ExerciseContent } from './exercise';
import { parseTypedNumber } from './parse';
import { type Rational, equals } from './rational';

/** What the child answered, per exercise type. */
export type ExerciseResponse =
  | { type: 'numeric'; text: string }
  | { type: 'choice'; index: number }
  | { type: 'true-false'; value: boolean }
  | { type: 'number-line'; value: Rational }
  | { type: 'order'; order: readonly number[] }
  | { type: 'match'; pairs: readonly number[] }
  | { type: 'fraction-shade'; shaded: number };

/**
 * `wrong-form` and `not-irreducible` mean the value is right but not written as asked, so the
 * interface can say so instead of marking the answer plainly wrong.
 */
export type Verdict =
  | { correct: true }
  | { correct: false; reason: 'unreadable' | 'incorrect' | 'wrong-form' | 'not-irreducible' };

const sameList = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const verdict = (correct: boolean): Verdict =>
  correct ? { correct: true } : { correct: false, reason: 'incorrect' };

export function gradeResponse(exercise: ExerciseContent, response: ExerciseResponse): Verdict {
  if (exercise.type !== response.type) return { correct: false, reason: 'unreadable' };

  switch (response.type) {
    case 'numeric': {
      if (exercise.type !== 'numeric') break;
      const typed = parseTypedNumber(response.text);
      if (!typed) return { correct: false, reason: 'unreadable' };
      if (!equals(typed.value, exercise.answer)) return verdict(false);
      if (exercise.forms && !exercise.forms.includes(typed.form)) {
        return { correct: false, reason: 'wrong-form' };
      }
      if (exercise.irreducible && typed.form === 'fraction' && !typed.irreducible) {
        return { correct: false, reason: 'not-irreducible' };
      }
      return verdict(true);
    }
    case 'choice':
      if (exercise.type === 'choice') return verdict(response.index === exercise.answer);
      break;
    case 'true-false':
      if (exercise.type === 'true-false') return verdict(response.value === exercise.answer);
      break;
    case 'number-line':
      if (exercise.type === 'number-line') return verdict(equals(response.value, exercise.answer));
      break;
    case 'order':
      if (exercise.type === 'order') return verdict(sameList(response.order, exercise.answer));
      break;
    case 'match':
      if (exercise.type === 'match') return verdict(sameList(response.pairs, exercise.answer));
      break;
    case 'fraction-shade':
      if (exercise.type === 'fraction-shade') return verdict(response.shaded === exercise.answer);
      break;
  }
  return { correct: false, reason: 'unreadable' };
}
