import { gradeResponse, type NumericExercise } from '@math-genius/exercise-engine';
import { cx, ThemedText, View } from '@math-genius/ui';
import { useState } from 'react';

import { strings } from '@/i18n';
import { applyKey, type KeypadKey } from '@/utils/keypad';

import { Keypad } from './keypad';
import type { InputProps } from './types';

const t = strings.practice;

export function NumericInput({ exercise, answered, onChange }: InputProps<NumericExercise>) {
  const [text, setText] = useState('');
  const type = (key: KeypadKey) => {
    const next = applyKey(text, key);
    setText(next);
    onChange(next.length > 0 ? { type: 'numeric', text: next } : null);
  };
  const shown = answered?.type === 'numeric' ? answered.text : text;
  const border = answered
    ? gradeResponse(exercise, answered).correct
      ? 'border-success'
      : 'border-danger'
    : 'border-border';

  return (
    <View className="gap-4">
      <View
        accessible
        accessibilityLabel={t.keypad.answer}
        accessibilityValue={{ text: shown }}
        accessibilityLiveRegion="polite"
        className={cx(
          'min-h-16 flex-row items-center justify-center gap-2 rounded-lg border-3 bg-surface px-4 py-2',
          border,
        )}
      >
        <ThemedText variant="display" tone={shown ? 'default' : 'muted'}>
          {shown || '?'}
        </ThemedText>
        {exercise.unit ? (
          <ThemedText variant="title" tone="muted">
            {exercise.unit}
          </ThemedText>
        ) : null}
      </View>
      {answered ? null : <Keypad onKey={type} />}
    </View>
  );
}
