import type { ExerciseContent, ExerciseResponse } from '@math-genius/exercise-engine';

export type InputProps<T extends ExerciseContent> = {
  exercise: T;
  /** The graded answer: the input freezes and shows it next to the right one. */
  answered: ExerciseResponse | null;
  /**
   * The answer as it stands, each time it changes: null while it is not complete. The screen's
   * VALIDER button sends it.
   */
  onChange: (draft: ExerciseResponse | null) => void;
};
