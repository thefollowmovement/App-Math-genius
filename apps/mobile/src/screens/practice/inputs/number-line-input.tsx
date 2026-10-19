import {
  add,
  div,
  equals,
  formatNumber,
  isInteger,
  mul,
  rational,
  sub,
  type NumberLineExercise,
} from '@math-genius/exercise-engine';
import { Button, ThemedText, View } from '@math-genius/ui';
import { useEffect, useState } from 'react';
import { StyleSheet, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { strings } from '@/i18n';
import { haptics } from '@/lib/haptics';

import type { InputProps } from './types';

const t = strings.practice;

/** Snap to the nearest graduation after a drag, carrying the finger's velocity. */
const SNAP = { duration: 400, dampingRatio: 0.8 } as const;
/** At most this many labels under the line, so that they never overlap. */
const MAX_LABELS = 11;

export function graduationCount({ min, max, step }: NumberLineExercise): number {
  const count = div(sub(max, min), step);
  return count.num / count.den;
}

const valueAt = ({ min, step }: NumberLineExercise, index: number) =>
  add(min, mul(step, rational(index)));

function labelIndexes(exercise: NumberLineExercise, count: number): number[] {
  const integers = Array.from({ length: count + 1 }, (_, index) => index).filter((index) =>
    isInteger(valueAt(exercise, index)),
  );
  return integers.length >= 2 && integers.length <= MAX_LABELS ? integers : [0, count];
}

/** Places a number by dragging (or touching) a cursor that snaps to the graduations. */
export function NumberLineInput({ exercise, answered, onChange }: InputProps<NumberLineExercise>) {
  const count = graduationCount(exercise);
  const [index, setIndex] = useState(Math.floor(count / 2));
  const [width, setWidth] = useState(0);
  const done = answered !== null;
  const gap = width / count;
  const x = useSharedValue(0);
  const step = useSharedValue(0);
  const labels = labelIndexes(exercise, count);
  const answerIndex = Array.from({ length: count + 1 }, (_, i) => i).find((i) =>
    equals(valueAt(exercise, i), exercise.answer),
  );

  // The cursor always points at a graduation: there is always an answer to validate.
  useEffect(() => {
    if (!done) onChange({ type: 'number-line', value: valueAt(exercise, index) });
  }, [done, exercise, index, onChange]);

  const place = (next: number) => {
    const clamped = Math.min(count, Math.max(0, next));
    setIndex(clamped);
    x.set(withSpring(clamped * step.get(), SNAP));
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    setWidth(measured);
    step.set(measured / count);
    x.set(index * (measured / count));
  };

  // The React Compiler memoizes the gesture: rebuilding it mid-drag would drop the drag.
  const settle = (position: number, velocity: number) => {
    'worklet';
    const nearest = Math.min(count, Math.max(0, Math.round(position / Math.max(step.get(), 1))));
    x.set(withSpring(nearest * step.get(), { ...SNAP, velocity }));
    scheduleOnRN(setIndex, nearest);
  };
  // Horizontal drags only: a vertical swipe still scrolls the screen.
  const pan = Gesture.Pan()
    .enabled(!done)
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      x.set(Math.min(step.get() * count, Math.max(0, event.x)));
    })
    .onEnd((event) => settle(x.get(), event.velocityX));
  const touch = Gesture.Tap()
    .enabled(!done)
    .onEnd((event) => settle(event.x, 0));
  const gesture = Gesture.Race(pan, touch);

  // One light tick each time the cursor crosses a graduation, in the same frame as the move.
  useAnimatedReaction(
    () => Math.round(x.get() / Math.max(step.get(), 1)),
    (current, previous) => {
      if (previous !== null && current !== previous) scheduleOnRN(haptics.tick);
    },
  );

  const cursorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View className="gap-4 px-4">
      <GestureDetector gesture={gesture}>
        <View
          onLayout={onLayout}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={t.numberLine.line}
          accessibilityValue={{ text: t.numberLine.cursor(index, count) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) =>
            place(index + (event.nativeEvent.actionName === 'increment' ? 1 : -1))
          }
          className="h-20 justify-center"
        >
          <View className="h-1 rounded-full bg-foreground" />
          {Array.from({ length: count + 1 }, (_, i) => (
            <View key={i} style={[styles.marker, { left: i * gap }]}>
              <View
                className={
                  labels.includes(i)
                    ? 'h-8 w-1 rounded-full bg-foreground'
                    : 'h-5 w-0.5 rounded-full bg-foreground'
                }
              />
            </View>
          ))}
          {done && answerIndex !== undefined ? (
            <View
              style={[styles.marker, { left: answerIndex * gap }]}
              accessibilityLabel={t.numberLine.answer}
            >
              <View className="size-10 rounded-full border-4 border-success" />
            </View>
          ) : null}
          <Animated.View style={[styles.marker, styles.cursor, cursorStyle]} pointerEvents="none">
            <View className="size-8 rounded-full border-4 border-surface bg-primary" />
          </Animated.View>
        </View>
      </GestureDetector>
      <View className="h-6">
        {labels.map((i) => (
          <View key={i} style={[styles.marker, { left: i * gap }]}>
            <ThemedText variant="caption" tone="default">
              {formatNumber(valueAt(exercise, i))}
            </ThemedText>
          </View>
        ))}
      </View>
      {done ? null : (
        <View className="flex-row justify-center gap-3">
          <Button
            title="◀"
            accessibilityLabel={t.numberLine.left}
            variant="secondary"
            onPress={() => place(index - 1)}
          />
          <Button
            title="▶"
            accessibilityLabel={t.numberLine.right}
            variant="secondary"
            onPress={() => place(index + 1)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // A zero-width column centred on its position: what it holds is centred on the graduation.
  marker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  cursor: { left: 0 },
});
