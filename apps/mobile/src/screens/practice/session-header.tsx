import { Pressable, ThemedText, View } from '@math-genius/ui';
import { StyleSheet } from 'react-native';

import { Icon } from '@/components/game/icons';
import { ProgressBar } from '@/components/game/progress-bar';
import { strings } from '@/i18n';

const t = strings.practice;

/** Answers in a row from which the combo shows. */
export const COMBO_FROM = 3;

/** How far the session has gone toward its goal, in exercises or in minutes. */
export type SessionCount = { done: number; total: number; unit: 'exercises' | 'minutes' };

type SessionHeaderProps = {
  /** Share of the session goal done, 0 to 1. */
  progress: number;
  count: SessionCount;
  /** Right answers in a row, the current one included. */
  combo: number;
  onPause: () => void;
};

/** Pause, the session's progress and count, and the combo once it is worth a cheer. */
export function SessionHeader({ progress, count, combo, onPause }: SessionHeaderProps) {
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const minutes = count.unit === 'minutes';
  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.pauseLabel}
          onPress={onPause}
          hitSlop={4}
          className="size-11 items-center justify-center rounded-md border-2 border-border bg-surface active:opacity-80"
        >
          <Icon name="close" color="muted" size="sm" />
        </Pressable>
        <ProgressBar
          value={progress}
          size="lg"
          label={t.progress(percent)}
          fillStyle={styles.fill}
          className="flex-1"
        />
        <ThemedText
          variant="tag"
          tone="muted"
          accessibilityLabel={
            minutes
              ? t.counter.minutesLabel(count.done, count.total)
              : t.counter.countLabel(count.done, count.total)
          }
        >
          {minutes
            ? t.counter.minutes(count.done, count.total)
            : t.counter.count(count.done, count.total)}
        </ThemedText>
      </View>
      {combo >= COMBO_FROM ? (
        <View
          accessible
          accessibilityLabel={t.comboLabel(combo)}
          accessibilityLiveRegion="polite"
          className="flex-row items-center gap-2 self-center rounded-full border-2 border-fire bg-background px-4 py-2 glow-fire"
        >
          <Icon name="bolt" color="accent" size="sm" />
          <ThemedText variant="tag" tone="accent">
            {t.combo(combo)}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

// The fill follows each answer (150 ms): out of the flow, so no layout pass.
const styles = StyleSheet.create({
  fill: {
    transitionProperty: 'width',
    transitionDuration: 150,
    transitionTimingFunction: 'ease-out',
  },
});
