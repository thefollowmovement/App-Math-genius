import type { ChoiceExercise } from '@math-genius/exercise-engine';
import { View } from '@math-genius/ui';

import { Tile, type TileState } from '../tile';
import type { InputProps } from './types';

export function ChoiceInput({ exercise, answered, onSubmit }: InputProps<ChoiceExercise>) {
  const chosen = answered?.type === 'choice' ? answered.index : null;
  const state = (index: number): TileState => {
    if (chosen === null) return 'idle';
    if (index === exercise.answer) return 'right';
    return index === chosen ? 'wrong' : 'idle';
  };

  return (
    <View className="gap-3">
      {exercise.options.map((option, index) => (
        <Tile
          key={option.label}
          label={option.label}
          state={state(index)}
          disabled={chosen !== null}
          onPress={() => onSubmit({ type: 'choice', index })}
        />
      ))}
    </View>
  );
}
