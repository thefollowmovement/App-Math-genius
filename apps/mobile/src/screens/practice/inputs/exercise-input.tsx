import type { Exercise, ExerciseResponse } from '@math-genius/exercise-engine';

import { ChoiceInput } from './choice-input';
import { FractionShadeInput } from './fraction-shade-input';
import { MatchInput } from './match-input';
import { NumberLineInput } from './number-line-input';
import { NumericInput } from './numeric-input';
import { OrderInput } from './order-input';
import { TrueFalseInput } from './true-false-input';

type ExerciseInputProps = {
  exercise: Exercise;
  answered: ExerciseResponse | null;
  onSubmit: (response: ExerciseResponse) => void;
};

/** The way of answering that fits the exercise type (docs/specs.md, Types d'exercices). */
export function ExerciseInput({ exercise, ...props }: ExerciseInputProps) {
  switch (exercise.type) {
    case 'numeric':
      return <NumericInput exercise={exercise} {...props} />;
    case 'choice':
      return <ChoiceInput exercise={exercise} {...props} />;
    case 'true-false':
      return <TrueFalseInput exercise={exercise} {...props} />;
    case 'number-line':
      return <NumberLineInput exercise={exercise} {...props} />;
    case 'order':
      return <OrderInput exercise={exercise} {...props} />;
    case 'match':
      return <MatchInput exercise={exercise} {...props} />;
    case 'fraction-shade':
      return <FractionShadeInput exercise={exercise} {...props} />;
  }
}
