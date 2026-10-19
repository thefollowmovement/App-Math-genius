import type { TrueFalseExercise } from '@math-genius/exercise-engine';
import { View } from '@math-genius/ui';

import { strings } from '@/i18n';

import { Tile, type TileState } from '../tile';
import type { InputProps } from './types';

const t = strings.practice;

export function TrueFalseInput({ exercise, answered, onSubmit }: InputProps<TrueFalseExercise>) {
  const chosen = answered?.type === 'true-false' ? answered.value : null;
  const state = (value: boolean): TileState => {
    if (chosen === null) return 'idle';
    if (value === exercise.answer) return 'right';
    return value === chosen ? 'wrong' : 'idle';
  };

  return (
    <View className="flex-row gap-3">
      {[true, false].map((value) => (
        <Tile
          key={String(value)}
          label={value ? t.trueLabel : t.falseLabel}
          state={state(value)}
          disabled={chosen !== null}
          onPress={() => onSubmit({ type: 'true-false', value })}
          className="flex-1"
        />
      ))}
    </View>
  );
}
