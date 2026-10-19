import type { OrderExercise } from '@math-genius/exercise-engine';
import { ThemedText, View } from '@math-genius/ui';
import { useState } from 'react';

import { strings } from '@/i18n';

import { Tile } from '../tile';
import type { InputProps } from './types';

const t = strings.practice;

/** Ordering by touch: each label touched goes to the end of the child's row. */
export function OrderInput({ exercise, answered, onChange }: InputProps<OrderExercise>) {
  const [order, setOrder] = useState<number[]>([]);
  // Complete once every label is placed.
  const place = (next: number[]) => {
    setOrder(next);
    onChange(next.length === exercise.items.length ? { type: 'order', order: next } : null);
  };
  const done = answered !== null;
  const placed = answered?.type === 'order' ? answered.order : order;

  return (
    <View className="gap-4">
      <ThemedText variant="caption">{t.order.help}</ThemedText>
      <View
        accessibilityLabel={t.order.yours}
        className="min-h-20 flex-row flex-wrap items-center gap-2 rounded-md border-2 border-dashed border-border p-2"
      >
        {placed.map((itemIndex, position) => {
          const item = exercise.items[itemIndex] ?? '';
          const right = exercise.answer[position] === itemIndex;
          return (
            <Tile
              key={item}
              label={item}
              badge={position + 1}
              state={done ? (right ? 'right' : 'wrong') : 'selected'}
              disabled={done}
              accessibilityLabel={t.order.remove(item)}
              onPress={() => place(order.filter((index) => index !== itemIndex))}
            />
          );
        })}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {exercise.items.map((item, index) =>
          placed.includes(index) ? null : (
            <Tile
              key={item}
              label={item}
              disabled={done}
              onPress={() => place([...order, index])}
            />
          ),
        )}
      </View>
    </View>
  );
}
