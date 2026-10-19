import type { MatchExercise } from '@math-genius/exercise-engine';
import { ThemedText, View } from '@math-genius/ui';
import { useState } from 'react';

import { strings } from '@/i18n';

import { Tile, type TileState } from '../tile';
import type { InputProps } from './types';

const t = strings.practice;

/** Matching by touch: a label on the left, then its partner on the right. Pairs are numbered. */
export function MatchInput({ exercise, answered, onChange }: InputProps<MatchExercise>) {
  const [pairs, setPairs] = useState<(number | null)[]>(() => exercise.left.map(() => null));
  const [selected, setSelected] = useState<number | null>(null);
  const done = answered !== null;
  const shown: readonly (number | null)[] = answered?.type === 'match' ? answered.pairs : pairs;
  const leftOf = (right: number) => shown.indexOf(right);

  // Complete once every label on the left has a partner.
  const update = (next: (number | null)[]) => {
    setPairs(next);
    onChange(
      next.every((right) => right !== null)
        ? { type: 'match', pairs: next.map((right) => right ?? 0) }
        : null,
    );
  };
  const pressLeft = (left: number) => {
    update(pairs.map((right, index) => (index === left ? null : right)));
    setSelected((current) => (current === left ? null : left));
  };
  const pressRight = (right: number) => {
    update(
      pairs.map((paired, index) => {
        if (index === selected) return right;
        return paired === right ? null : paired;
      }),
    );
    setSelected(null);
  };

  const leftState = (left: number): TileState => {
    if (done) return shown[left] === exercise.answer[left] ? 'right' : 'wrong';
    return selected === left ? 'selected' : 'idle';
  };
  const rightState = (right: number): TileState => {
    const left = leftOf(right);
    if (!done || left === -1) return 'idle';
    return exercise.answer[left] === right ? 'right' : 'wrong';
  };
  const badge = (left: number) => (left === -1 || shown[left] === null ? undefined : left + 1);

  return (
    <View className="gap-4">
      <ThemedText variant="caption">{t.match.help}</ThemedText>
      <View className="flex-row gap-3">
        <View className="flex-1 gap-2">
          {exercise.left.map((label, left) => (
            <Tile
              key={label}
              label={label}
              badge={badge(left)}
              state={leftState(left)}
              disabled={done}
              accessibilityLabel={badge(left) === undefined ? label : t.match.pair(label, left + 1)}
              onPress={() => pressLeft(left)}
            />
          ))}
        </View>
        <View className="flex-1 gap-2">
          {exercise.right.map((label, right) => (
            <Tile
              key={label}
              label={label}
              badge={badge(leftOf(right))}
              state={rightState(right)}
              disabled={done || (selected === null && leftOf(right) === -1)}
              accessibilityLabel={
                leftOf(right) === -1 ? label : t.match.pair(label, leftOf(right) + 1)
              }
              onPress={() => pressRight(right)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
