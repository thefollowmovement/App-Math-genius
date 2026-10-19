import { useTheme, View } from '@math-genius/ui';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/** Answers faster than this in a "calcul éclair" round get a special cheer. */
export const ECLAIR_MS = 10_000;

/** A bar that empties in 10 seconds during timed mental calculation. Nothing happens at zero. */
export function EclairTimer() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const left = useSharedValue(1);

  useEffect(() => {
    left.set(withTiming(0, { duration: ECLAIR_MS, easing: Easing.linear }));
  }, [left]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: left.get() }] }));

  if (reducedMotion) return null;
  return (
    <View accessible={false} className="h-2 overflow-hidden rounded-full bg-surface">
      <Animated.View style={[styles.bar, { backgroundColor: colors.secondary }, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flex: 1, transformOrigin: 'left' },
});
