import { Button, Pressable, Screen, ThemedText, View } from '@math-genius/ui';
import { useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  css,
  cubicBezier,
  useReducedMotion,
  type CSSStyle,
} from 'react-native-reanimated';

import { ErrorMessage } from '@/components/error-message';
import type { ErrorKind } from '@/data/errors';
import type { OpenedChest } from '@/data/rewards-model';
import { strings } from '@/i18n';
import { haptics } from '@/lib/haptics';

const t = strings.chest;

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const REVEAL = FadeInDown.duration(300).easing(EASE_OUT);

type ChestOpeningProps = {
  kind: 'common' | 'rare';
  /** What the chest held, once opened by the server. */
  opened: OpenedChest | null;
  opening: boolean;
  error: ErrorKind | null;
  onOpen: () => void;
  onDone: () => void;
};

/** A chest to open with a touch: it wobbles until opened, then shows its gems. */
export function ChestOpening({ kind, opened, opening, error, onOpen, onDone }: ChestOpeningProps) {
  const reduced = useReducedMotion();
  // The success buzz lands with the reveal, once.
  useEffect(() => {
    if (opened) haptics.success();
  }, [opened]);

  return (
    <Screen centered>
      <ThemedText variant="title" className="text-center" accessibilityRole="header">
        {kind === 'rare' ? t.rare : t.common}
      </ThemedText>
      {opened ? (
        <Animated.View entering={reduced ? undefined : REVEAL}>
          <View className="items-center gap-4" accessibilityLiveRegion="polite">
            <Animated.View style={reduced ? styles.big : styles.pop}>
              <ThemedText variant="display" className="text-center">
                {t.opened}
              </ThemedText>
            </Animated.View>
            <ThemedText variant="title" className="text-center">
              {t.found(opened.gems)}
            </ThemedText>
            <ThemedText className="text-center">{t.total(opened.total)}</ThemedText>
            <Button size="lg" title={t.done} onPress={onDone} className="self-stretch" />
          </View>
        </Animated.View>
      ) : (
        <View className="items-center gap-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.open}
            disabled={opening}
            onPress={onOpen}
            className="items-center justify-center p-8 active:opacity-80"
          >
            <Animated.View style={reduced || opening ? styles.big : styles.wobble}>
              <ThemedText variant="display">{kind === 'rare' ? t.rareClosed : t.closed}</ThemedText>
            </Animated.View>
          </Pressable>
          <ThemedText className="text-center">{t.hint}</ThemedText>
          <ErrorMessage kind={error} />
          <Button
            size="lg"
            title={t.open}
            loading={opening}
            onPress={onOpen}
            className="self-stretch"
          />
        </View>
      )}
    </Screen>
  );
}

// Waits to be opened: a slow wobble, paused every other second.
const wobble = css.keyframes({
  '0%': { transform: [{ rotate: '0deg' }, { scale: 2 }] },
  '15%': { transform: [{ rotate: '-8deg' }, { scale: 2 }] },
  '30%': { transform: [{ rotate: '8deg' }, { scale: 2 }] },
  '45%': { transform: [{ rotate: '0deg' }, { scale: 2 }] },
  '100%': { transform: [{ rotate: '0deg' }, { scale: 2 }] },
});

// The gem arrives slightly too big and settles.
const pop = css.keyframes({
  '0%': { opacity: 0, transform: [{ scale: 1.4 }] },
  '60%': { opacity: 1, transform: [{ scale: 2.3 }] },
  '100%': { opacity: 1, transform: [{ scale: 2 }] },
});

const styles: Record<'big' | 'wobble' | 'pop', CSSStyle<ViewStyle>> = {
  // Twice the display size: the chest is the whole screen's point.
  big: { transform: [{ scale: 2 }] },
  wobble: {
    transform: [{ scale: 2 }],
    animationName: wobble,
    animationDuration: '1600ms',
    animationIterationCount: 'infinite',
    animationTimingFunction: cubicBezier(0.77, 0, 0.175, 1),
  },
  pop: {
    transform: [{ scale: 2 }],
    animationName: pop,
    animationDuration: '400ms',
    animationTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
  },
};
