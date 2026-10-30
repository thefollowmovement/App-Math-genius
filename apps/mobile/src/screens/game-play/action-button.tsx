import { ThemedText, View } from '@math-genius/ui';
import { useMemo } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { SceneInput } from '@/games/kit/scene';

type ActionButtonProps = {
  title: string;
  label: string;
  disabled: boolean;
  input: SharedValue<SceneInput>;
  /** For screen readers, whose « activate » comes as an action, not a touch. */
  onAction: () => void;
};

/**
 * « Pêcher ! »: it acts as the finger lands, on the UI thread with the scene (no wait for the
 * finger to lift, nor for a press delay): a reflex button. It shrinks a little while pressed.
 */
export function ActionButton({ title, label, disabled, input, onAction }: ActionButtonProps) {
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);
  const gesture = useMemo(
    () =>
      Gesture.Tap()
        .enabled(!disabled)
        .maxDuration(60_000)
        .onBegin(() => {
          'worklet';
          const value = input.get();
          input.set({ ...value, taps: value.taps + 1 });
          pressed.set(withTiming(1, { duration: 100 }));
        })
        .onFinalize(() => {
          'worklet';
          pressed.set(withTiming(0, { duration: 150 }));
        }),
    [disabled, input, pressed],
  );
  const press = useAnimatedStyle(() => ({
    transform: [{ scale: reduced ? 1 : 1 - pressed.get() * 0.03 }],
    opacity: 1 - pressed.get() * 0.15,
  }));
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={press}>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
          accessibilityActions={[{ name: 'activate' }]}
          onAccessibilityAction={(event) => {
            if (!disabled && event.nativeEvent.actionName === 'activate') onAction();
          }}
          className={
            disabled
              ? 'min-h-16 items-center justify-center rounded-lg border-b-(length:--theme-relief-depth) border-b-relief bg-accent px-6 py-3 opacity-40'
              : 'min-h-16 items-center justify-center rounded-lg border-b-(length:--theme-relief-depth) border-b-relief bg-accent glow-accent px-6 py-3'
          }
        >
          <ThemedText variant="score" tone="onAccent">
            {title}
          </ThemedText>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
