import {
  add,
  formatAnswer,
  formatNumber,
  rational,
  type Exercise,
  type ExerciseResponse,
  type Rational,
} from '../index';

/** What a child who knows the answer would enter. */
export function rightResponse(exercise: Exercise): ExerciseResponse {
  switch (exercise.type) {
    case 'numeric':
      return { type: 'numeric', text: formatAnswer(exercise) };
    case 'choice':
      return { type: 'choice', index: exercise.answer };
    case 'true-false':
      return { type: 'true-false', value: exercise.answer };
    case 'number-line':
      return { type: 'number-line', value: exercise.answer };
    case 'order':
      return { type: 'order', order: exercise.answer };
    case 'match':
      return { type: 'match', pairs: exercise.answer };
    case 'fraction-shade':
      return { type: 'fraction-shade', shaded: exercise.answer };
  }
}

/** A wrong answer of the right kind. */
export function wrongResponse(exercise: Exercise): ExerciseResponse {
  switch (exercise.type) {
    case 'numeric':
      return { type: 'numeric', text: formatNumber(add(exercise.answer, rational(1))) };
    case 'choice':
      return { type: 'choice', index: (exercise.answer + 1) % exercise.options.length };
    case 'true-false':
      return { type: 'true-false', value: !exercise.answer };
    case 'number-line':
      return { type: 'number-line', value: add(exercise.answer, exercise.step) };
    case 'order':
      return { type: 'order', order: [...exercise.answer].reverse() };
    case 'match':
      return { type: 'match', pairs: [...exercise.answer].reverse() };
    case 'fraction-shade':
      return { type: 'fraction-shade', shaded: exercise.answer === 1 ? 2 : exercise.answer - 1 };
  }
}

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
