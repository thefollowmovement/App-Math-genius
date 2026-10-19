import type { TrueFalseExercise } from '@math-genius/exercise-engine';
import { View } from '@math-genius/ui';
import { useState } from 'react';

import { strings } from '@/i18n';

import { Tile, type TileState } from '../tile';
import type { InputProps } from './types';

const t = strings.practice;

export function TrueFalseInput({ exercise, answered, onChange }: InputProps<TrueFalseExercise>) {
  const [picked, setPicked] = useState<boolean | null>(null);
  const chosen = answered?.type === 'true-false' ? answered.value : null;
  const state = (value: boolean): TileState => {
    if (chosen === null) return value === picked ? 'selected' : 'idle';
    if (value === exercise.answer) return 'right';
    return value === chosen ? 'wrong' : 'idle';
  };
  const pick = (value: boolean) => {
    setPicked(value);
    onChange({ type: 'true-false', value });
  };

  return (
    <View className="flex-row gap-4" accessibilityRole="radiogroup">
      {[true, false].map((value) => (
        <Tile
          key={String(value)}
          label={value ? t.trueLabel : t.falseLabel}
          size="lg"
          state={state(value)}
          disabled={chosen !== null}
          onPress={() => pick(value)}
          className="flex-1"
        />
      ))}
    </View>
  );
}
