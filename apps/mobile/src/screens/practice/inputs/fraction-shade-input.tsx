import type { FractionShadeExercise } from '@math-genius/exercise-engine';
import { cx, Pressable, ThemedText, View } from '@math-genius/ui';
import { useState } from 'react';

import { strings } from '@/i18n';

import type { InputProps } from './types';

const t = strings.practice;

/** Parts per row: the bar wraps into equal rows so that every part stays easy to touch. */
export function columnsFor(parts: number): number {
  for (let columns = Math.min(parts, 10); columns > 1; columns--) {
    if (parts % columns === 0) return columns;
  }
  return parts;
}

export function FractionShadeInput({
  exercise,
  answered,
  onChange,
}: InputProps<FractionShadeExercise>) {
  const [shaded, setShaded] = useState<boolean[]>(() => Array(exercise.parts).fill(false));
  const toggle = (part: number) => {
    const next = shaded.map((value, index) => (index === part ? !value : value));
    const parts = next.filter(Boolean).length;
    setShaded(next);
    onChange(parts > 0 ? { type: 'fraction-shade', shaded: parts } : null);
  };
  const done = answered !== null;
  const count = shaded.filter(Boolean).length;
  const columns = columnsFor(exercise.parts);
  const rows = Array.from({ length: exercise.parts / columns }, (_, row) =>
    Array.from({ length: columns }, (__, column) => row * columns + column),
  );

  return (
    <View className="gap-4">
      <ThemedText variant="caption">{t.shade.help}</ThemedText>
      <View
        className={cx(
          'gap-1 rounded-md border-3 p-1',
          done
            ? count === exercise.answer
              ? 'border-success'
              : 'border-danger'
            : 'border-foreground',
        )}
      >
        {rows.map((row) => (
          <View key={row[0]} className="flex-row gap-1">
            {row.map((part) => (
              <Pressable
                key={part}
                accessibilityRole="checkbox"
                accessibilityLabel={t.shade.part(part + 1, shaded[part] ?? false)}
                accessibilityState={{ checked: shaded[part], disabled: done }}
                disabled={done}
                onPress={() => toggle(part)}
                className={cx(
                  'h-12 flex-1 rounded-sm border',
                  shaded[part] ? 'border-primary bg-primary' : 'border-border bg-surface',
                )}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
