import type { ChoiceExercise } from '@math-genius/exercise-engine';
import { View } from '@math-genius/ui';
import { useState } from 'react';

import { Tile, type TileState } from '../tile';
import type { InputProps } from './types';

/** The options, two by two: the child picks one, then validates. */
export function ChoiceInput({ exercise, answered, onChange }: InputProps<ChoiceExercise>) {
  const [picked, setPicked] = useState<number | null>(null);
  const chosen = answered?.type === 'choice' ? answered.index : null;
  const state = (index: number): TileState => {
    if (chosen === null) return index === picked ? 'selected' : 'idle';
    if (index === exercise.answer) return 'right';
    return index === chosen ? 'wrong' : 'idle';
  };
  const pick = (index: number) => {
    setPicked(index);
    onChange({ type: 'choice', index });
  };

  return (
    <View className="flex-row flex-wrap gap-4" accessibilityRole="radiogroup">
      {exercise.options.map((option, index) => (
        <Tile
          key={option.label}
          label={option.label}
          size="lg"
          state={state(index)}
          disabled={chosen !== null}
          onPress={() => pick(index)}
          // Two by two: each takes half the row, less half the gap.
          className="grow basis-[45%]"
        />
      ))}
    </View>
  );
}
