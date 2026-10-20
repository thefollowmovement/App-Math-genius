import type { ErrorTypeCode } from '@math-genius/curriculum';

import type { ExerciseContent, Mistakes } from './exercise';
import { type ExerciseResponse, gradeResponse } from './grade';
import { parseTypedNumber } from './parse';
import { type Rational, equals } from './rational';

/**
 * The typical mistake behind a wrong answer, if the exercise knows it (docs/specs.md, Coach IA :
 * diagnostic par le code): the answer is one its generator computed for that mistake. Null for a
 * right answer, or a wrong one the exercise cannot explain.
 */
export function diagnoseResponse(
  exercise: ExerciseContent,
  response: ExerciseResponse,
): ErrorTypeCode | null {
  if (exercise.type !== response.type || gradeResponse(exercise, response).correct) return null;
  switch (response.type) {
    case 'numeric': {
      if (exercise.type !== 'numeric') return null;
      const typed = parseTypedNumber(response.text)?.value;
      return typed ? find(exercise.mistakes, exercise.answer, typed, equals) : null;
    }
    case 'number-line':
      if (exercise.type !== 'number-line') return null;
      return find(exercise.mistakes, exercise.answer, response.value, equals);
    case 'choice':
      if (exercise.type !== 'choice') return null;
      return find(exercise.mistakes, exercise.answer, response.index, same);
    case 'true-false':
      if (exercise.type !== 'true-false') return null;
      return find(exercise.mistakes, exercise.answer, response.value, same);
    case 'fraction-shade':
      if (exercise.type !== 'fraction-shade') return null;
      return find(exercise.mistakes, exercise.answer, response.shaded, same);
    case 'order':
      if (exercise.type !== 'order') return null;
      return find(exercise.mistakes, exercise.answer, response.order, sameList);
    case 'match':
      if (exercise.type !== 'match') return null;
      return find(exercise.mistakes, exercise.answer, response.pairs, sameList);
  }
}

const same = <T>(a: T, b: T) => a === b;
const sameList = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/** The first mistake whose answer is the child's, leaving out those equal to the right answer. */
function find<T>(
  mistakes: Mistakes<T> | undefined,
  answer: T,
  given: T,
  equal: (a: T, b: T) => boolean,
): ErrorTypeCode | null {
  for (const [code, values] of Object.entries(mistakes ?? {}) as [
    ErrorTypeCode,
    (T | undefined)[],
  ][]) {
    for (const value of values) {
      if (value !== undefined && !equal(value, answer) && equal(value, given)) return code;
    }
  }
  return null;
}

/** Every typical mistake of an exercise that is a wrong answer, for the tests and the catalogue. */
export function mistakeList(
  exercise: ExerciseContent,
): { error: ErrorTypeCode; answer: unknown }[] {
  const equal = (a: unknown, b: unknown): boolean => {
    if (Array.isArray(a) && Array.isArray(b)) return sameList(a, b);
    if (isRational(a) && isRational(b)) return equals(a, b);
    return a === b;
  };
  const entries = Object.entries(exercise.mistakes ?? {}) as [ErrorTypeCode, unknown[]][];
  return entries.flatMap(([error, values]) =>
    values
      .filter((value) => value !== undefined && !equal(value, exercise.answer))
      .map((answer) => ({ error, answer })),
  );
}

const isRational = (value: unknown): value is Rational =>
  typeof value === 'object' && value !== null && 'num' in value && 'den' in value;
