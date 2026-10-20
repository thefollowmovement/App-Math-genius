import { diagnoseResponse } from '../diagnose';
import type { Exercise } from '../exercise';
import { formatNumber } from '../format';
import { type ExerciseResponse, gradeResponse } from '../grade';
import { add, rational } from '../rational';

/** Wrong answers of every kind, from the closest. */
function candidates(exercise: Exercise): ExerciseResponse[] {
  switch (exercise.type) {
    case 'numeric':
      return [1, 2, 10, 3].map((delta) => ({
        type: 'numeric',
        text: formatNumber(add(exercise.answer, rational(delta))),
      }));
    case 'choice':
      return exercise.options.map((_, index) => ({ type: 'choice', index }));
    case 'true-false':
      return [{ type: 'true-false', value: !exercise.answer }];
    case 'number-line':
      return [1, -1, 2, -2, 3, -3].map((times) => ({
        type: 'number-line',
        value: add(exercise.answer, rational(times * exercise.step.num, exercise.step.den)),
      }));
    case 'order':
      return exercise.answer.slice(1).map((_, index) => {
        const order = [...exercise.answer];
        [order[index], order[index + 1]] = [order[index + 1] ?? 0, order[index] ?? 0];
        return { type: 'order', order };
      });
    case 'match':
      return [
        { type: 'match', pairs: [...exercise.answer.slice(1), ...exercise.answer.slice(0, 1)] },
      ];
    case 'fraction-shade':
      return [exercise.answer + 1, exercise.answer - 1]
        .filter((count) => count >= 0 && count <= exercise.parts)
        .map((shaded) => ({ type: 'fraction-shade', shaded }));
  }
}

/** A wrong answer that is none of the exercise's typical mistakes, if there is one. */
export function wrongAnswer(exercise: Exercise): ExerciseResponse | null {
  return (
    candidates(exercise).find(
      (response) =>
        !gradeResponse(exercise, response).correct && diagnoseResponse(exercise, response) === null,
    ) ?? null
  );
}
