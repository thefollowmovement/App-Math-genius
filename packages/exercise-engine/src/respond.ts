import type { Exercise } from './exercise';
import { formatNumber } from './format';
import type { ExerciseResponse } from './grade';
import type { Rational } from './rational';

/** What a child enters to give `answer` (an answer of the exercise's own kind, a mistake's). */
export function responseWith(exercise: Exercise, answer: unknown): ExerciseResponse {
  switch (exercise.type) {
    case 'numeric':
      return { type: 'numeric', text: formatNumber(answer as Rational) };
    case 'number-line':
      return { type: 'number-line', value: answer as Rational };
    case 'choice':
      return { type: 'choice', index: answer as number };
    case 'true-false':
      return { type: 'true-false', value: answer as boolean };
    case 'order':
      return { type: 'order', order: answer as number[] };
    case 'match':
      return { type: 'match', pairs: answer as number[] };
    case 'fraction-shade':
      return { type: 'fraction-shade', shaded: answer as number };
  }
}
