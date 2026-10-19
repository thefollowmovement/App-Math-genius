import type { CompanionLook } from '@math-genius/shared';
import { View } from '@math-genius/ui';
import { Image } from 'expo-image';
import type { ViewStyle } from 'react-native';
import Animated, { css, useReducedMotion, type CSSStyle } from 'react-native-reanimated';

import { COMPANION_ART } from './companion-art';

type CompanionPictureProps = {
  companion: CompanionLook;
  /** It floats gently, unless the child reduces animations. */
  float?: boolean;
  /** Spoken label; without one the picture is decorative. */
  label?: string;
};

/** A companion at its stage, filling its (square) box. The only place that draws companions. */
export function CompanionPicture({ companion, float = false, label }: CompanionPictureProps) {
  const reduced = useReducedMotion();
  const picture = (
    <Image
      source={COMPANION_ART[companion.id][companion.stage]}
      contentFit="contain"
      style={{ width: '100%', height: '100%' }}
      accessible={label !== undefined}
      accessibilityLabel={label}
      accessibilityRole={label === undefined ? undefined : 'image'}
      importantForAccessibility={label === undefined ? 'no-hide-descendants' : 'yes'}
    />
  );
  if (!float || reduced) return picture;
  return (
    // A slow loop of a few points, transform only: it never moves the layout around it.
    <Animated.View style={styles.float}>
      <View className="size-full">{picture}</View>
    </Animated.View>
  );
}

const float = css.keyframes({
  from: { transform: [{ translateY: 0 }] },
  to: { transform: [{ translateY: -4 }] },
});

const styles: Record<'float', CSSStyle<ViewStyle>> = {
  float: {
    width: '100%',
    height: '100%',
    animationName: float,
    animationDuration: '1600ms',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
  },
};
