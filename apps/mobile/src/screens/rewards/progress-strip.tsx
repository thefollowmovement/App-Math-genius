import { ThemedText, View } from '@math-genius/ui';

import type { ProgressView } from '@/data/rewards-model';
import { strings } from '@/i18n';
import { levelPercent, levelTitle } from '@/utils/reward-text';

const t = strings.rewards;

/** Streak, gems and level at a glance, on the child's home. */
export function ProgressStrip({ progress }: { progress: ProgressView }) {
  const percent = levelPercent(progress.inLevel, progress.toNext);
  return (
    <View className="gap-3 rounded-lg border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between gap-4">
        <View
          accessible
          accessibilityLabel={t.streakLabel(progress.streak)}
          className="flex-row items-center gap-1"
        >
          <ThemedText variant="headline">{t.flame}</ThemedText>
          <ThemedText variant="headline">{t.streak(progress.streak)}</ThemedText>
        </View>
        <View
          accessible
          accessibilityLabel={t.gemsLabel(progress.gems)}
          className="flex-row items-center gap-1"
        >
          <ThemedText variant="headline">{t.gem}</ThemedText>
          <ThemedText variant="headline">{t.gems(progress.gems)}</ThemedText>
        </View>
        <ThemedText variant="headline">{t.level(progress.level)}</ThemedText>
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t.levelLabel(progress.level, progress.inLevel, progress.toNext)}
        accessibilityValue={{ min: 0, max: progress.toNext, now: progress.inLevel }}
        className="h-3 overflow-hidden rounded-full bg-background"
      >
        <View className="h-3 rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </View>
      <ThemedText variant="caption">{levelTitle(progress.level)}</ThemedText>
    </View>
  );
}
