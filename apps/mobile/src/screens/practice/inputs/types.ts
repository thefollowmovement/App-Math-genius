import type { ExerciseContent, ExerciseResponse } from '@math-genius/exercise-engine';

export type InputProps<T extends ExerciseContent> = {
  exercise: T;
  /** The graded answer: the input freezes and shows it next to the right one. */
  answered: ExerciseResponse | null;
  onSubmit: (response: ExerciseResponse) => void;
};
