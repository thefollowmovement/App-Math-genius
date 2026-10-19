import type { Slot } from '@math-genius/exercise-engine';
import { Button, ThemedText, useTheme, View } from '@math-genius/ui';
import Animated from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

import { strings } from '@/i18n';

const t = strings.practice;

type SessionHeaderProps = {
  /** Share of the session goal done, 0 to 1. */
  progress: number;
  slot: Slot;
  twin: boolean;
  onPause: () => void;
};

export function SessionHeader({ progress, slot, twin, onPause }: SessionHeaderProps) {
  const { colors } = useTheme();
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <Button variant="ghost" title={t.pause} onPress={onPause} />
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t.progress(percent)}
          accessibilityValue={{ min: 0, max: 100, now: percent }}
          className="h-3 flex-1 overflow-hidden rounded-full border border-border bg-surface"
        >
          {/* Out of the flow and childless, so animating its width costs no layout pass. */}
          <Animated.View
            style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.primary }]}
          />
        </View>
      </View>
      <View className="flex-row flex-wrap gap-2">
        <Chip label={t.slots[slot]} />
        {twin ? <Chip label={t.twin} /> : null}
      </View>
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-secondary px-3 py-1">
      <ThemedText variant="caption" tone="onSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    transitionProperty: 'width',
    transitionDuration: 150,
    transitionTimingFunction: 'ease-out',
  },
});
