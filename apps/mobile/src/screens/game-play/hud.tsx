import { Pressable, ThemedText, View } from '@math-genius/ui';
import { useEffect, useState } from 'react';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Icon } from '@/components/game/icons';
import { strings } from '@/i18n';

const t = strings.games.play;

/** Seconds left, read from the round's clock twice a second (no render per frame). */
function useSecondsLeft(clock: SharedValue<number>, limitMs: number, running: boolean) {
  const [left, setLeft] = useState(Math.ceil(limitMs / 1000));
  useEffect(() => {
    const read = () => setLeft(Math.max(0, Math.ceil((limitMs - clock.get()) / 1000)));
    read();
    if (!running) return;
    const timer = setInterval(read, 500);
    return () => clearInterval(timer);
  }, [clock, limitMs, running]);
  return left;
}

type HudProps = {
  prompt: string | null;
  score: number;
  hearts: number | null;
  clock: SharedValue<number>;
  limitMs: number;
  running: boolean;
  onPause?: () => void;
};

/** The top of the game: pause, the question, the score; the time left and the hearts. */
export function Hud({ prompt, score, hearts, clock, limitMs, running, onPause }: HudProps) {
  const left = useSecondsLeft(clock, limitMs, running);
  // The bar empties on the UI thread, with the scene.
  const fill = useAnimatedStyle(() => ({
    width: `${Math.max(0, 1 - clock.get() / limitMs) * 100}%`,
  }));
  return (
    <View className="gap-2 px-4 pb-2">
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.pause}
          disabled={!onPause}
          onPress={onPause}
          className="size-12 items-center justify-center rounded-full border-2 border-border bg-surface active:opacity-80"
        >
          <Icon name="pause" color="foreground" size="sm" />
        </Pressable>
        <View
          accessible
          accessibilityLabel={prompt ?? t.noQuestion}
          accessibilityLiveRegion="polite"
          className="min-h-14 flex-1 items-center justify-center rounded-lg border-2 border-primary bg-surface px-3 py-2"
        >
          <ThemedText variant="statement" className="text-center" numberOfLines={2}>
            {prompt ?? '…'}
          </ThemedText>
        </View>
        <View
          accessible
          accessibilityLabel={t.scoreLabel(score)}
          className="min-w-16 items-center rounded-lg bg-accent px-3 py-2"
        >
          <ThemedText variant="tag" tone="onAccent">
            {score}
          </ThemedText>
        </View>
      </View>
      <View className="flex-row items-center gap-3">
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t.timeLabel(left)}
          className="h-3 flex-1 overflow-hidden rounded-full border-2 border-border bg-surface"
        >
          <Animated.View style={[{ height: '100%' }, fill]}>
            <View className="size-full rounded-full bg-secondary" />
          </Animated.View>
        </View>
        {hearts === null ? null : (
          <View accessible accessibilityLabel={t.hearts(hearts)} className="flex-row gap-1">
            {[0, 1, 2].map((index) => (
              <Icon
                key={index}
                name="heart"
                size="sm"
                color={index < hearts ? 'danger' : 'border'}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
