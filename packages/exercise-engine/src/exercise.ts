import type { ErrorTypeCode, SkillCode } from '@math-genius/curriculum';

import type { NumberForm } from './parse';
import type { Rational } from './rational';

export type Difficulty = 1 | 2 | 3 | 4 | 5;
export const DIFFICULTIES = [1, 2, 3, 4, 5] as const satisfies readonly Difficulty[];

/**
 * Typical wrong answers, by the mistake behind them (docs/specs.md, Coach IA : diagnostic par le
 * code), computed from the exercise's own numbers. Missing values, and values equal to the right
 * answer, are ignored: a generator can list them without conditions.
 */
export type Mistakes<T> = Partial<Record<ErrorTypeCode, readonly (T | undefined)[]>>;

type Common = {
  /** Instruction and data, as shown to the child. */
  prompt: string;
  /** Nudge shown on request, without giving the answer away. */
  hint: string;
  /** One to three steps shown after a wrong answer. */
  explanation: readonly string[];
};

/**
 * `check` fields hold the calculation or statement behind the answer, written with the numbers of
 * the prompt. Tests evaluate them with an independent exact evaluator (src/testing/oracle.ts).
 */
export type NumericExercise = Common & {
  type: 'numeric';
  check: string;
  answer: Rational;
  /** Accepted ways of writing the answer; any by default (0,5 = 0.5 = 1/2). */
  forms?: readonly NumberForm[];
  /** Fractions must be written irreducible. */
  irreducible?: boolean;
  /** Unit shown after the answer field, e.g. "cm". */
  unit?: string;
  /** Show the expected answer as a fraction (probabilities, fraction sums) rather than 0,25. */
  display?: 'fraction';
  mistakes?: Mistakes<Rational>;
};

export type ChoiceExercise = Common & {
  type: 'choice';
  /** 3 or 4 options; `check` is true for the right one only. */
  options: readonly { label: string; check: string }[];
  answer: number;
  /** Indices of the options a typical mistake picks. */
  mistakes?: Mistakes<number>;
};

export type TrueFalseExercise = Common & {
  type: 'true-false';
  check: string;
  answer: boolean;
  mistakes?: Mistakes<boolean>;
};

export type NumberLineExercise = Common & {
  type: 'number-line';
  min: Rational;
  max: Rational;
  /** Distance between two graduations; the cursor snaps to them. */
  step: Rational;
  /** Number to place, as written in the prompt. */
  target: string;
  answer: Rational;
  mistakes?: Mistakes<Rational>;
};

export type OrderExercise = Common & {
  type: 'order';
  direction: 'ascending' | 'descending';
  items: readonly string[];
  /** Indices of `items` in the expected order. */
  answer: readonly number[];
  mistakes?: Mistakes<readonly number[]>;
};

export type MatchExercise = Common & {
  type: 'match';
  left: readonly string[];
  right: readonly string[];
  /** `answer[i]` is the index in `right` that goes with `left[i]`. */
  answer: readonly number[];
  mistakes?: Mistakes<readonly number[]>;
};

export type FractionShadeExercise = Common & {
  type: 'fraction-shade';
  /** Equal parts of the bar. */
  parts: number;
  /** Fraction to shade, as written in the prompt. */
  fraction: string;
  /** Number of parts to shade, wherever they are. */
  answer: number;
  mistakes?: Mistakes<number>;
};

export type ExerciseContent =
  | NumericExercise
  | ChoiceExercise
  | TrueFalseExercise
  | NumberLineExercise
  | OrderExercise
  | MatchExercise
  | FractionShadeExercise;

export type ExerciseType = ExerciseContent['type'];

/** A generated exercise, replayable from its generator, difficulty and seed. */
export type Exercise = ExerciseContent & {
  generatorId: string;
  skill: SkillCode;
  difficulty: Difficulty;
  seed: number;
};
