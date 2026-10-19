import type { FractionShadeExercise } from '@math-genius/exercise-engine';
import { Button, cx, Pressable, ThemedText, View } from '@math-genius/ui';
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
  onSubmit,
}: InputProps<FractionShadeExercise>) {
  const [shaded, setShaded] = useState<boolean[]>(() => Array(exercise.parts).fill(false));
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
          'gap-1 rounded-md border-2 p-1',
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
                aria-checked={shaded[part] ?? false}
                disabled={done}
                onPress={() =>
                  setShaded((current) =>
                    current.map((value, index) => (index === part ? !value : value)),
                  )
                }
                className={cx(
                  'h-12 flex-1 rounded-sm border',
                  shaded[part] ? 'border-primary bg-primary' : 'border-border bg-surface',
                )}
              />
            ))}
          </View>
        ))}
      </View>
      {done ? null : (
        <Button
          title={t.submit}
          disabled={count === 0}
          onPress={() => onSubmit({ type: 'fraction-shade', shaded: count })}
        />
      )}
    </View>
  );
}
