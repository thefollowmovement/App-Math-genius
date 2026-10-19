import { ThemedText, View, cx } from '@math-genius/ui';

import type { ParentRewardView } from '@/data/parent-rewards-model';
import { strings } from '@/i18n';
import { levelPercent } from '@/utils/reward-text';

const t = strings.parentRewards;

/** The parent's reward to ask for, or the closest one to unlock, on the child's home. */
export function NextRewardCard({ reward }: { reward: ParentRewardView }) {
  const unlocked = reward.status === 'unlocked';
  return (
    <View
      className={cx(
        'gap-2 rounded-lg border bg-surface p-4',
        unlocked ? 'border-success' : 'border-border',
      )}
    >
      <ThemedText variant="headline">{`${t.child.icon} ${t.child.title}`}</ThemedText>
      <ThemedText>{reward.title}</ThemedText>
      {unlocked ? (
        <ThemedText variant="caption" tone="default" accessibilityLiveRegion="polite">
          {t.child.unlocked}
        </ThemedText>
      ) : (
        <>
          <ThemedText variant="caption">{t.goalText[reward.goal](reward.target)}</ThemedText>
          <View className="flex-row items-center gap-2">
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={t.child.progressLabel(reward.value, reward.target)}
              accessibilityValue={{ min: 0, max: reward.target, now: reward.value }}
              className="h-2 flex-1 overflow-hidden rounded-full border border-border bg-background"
            >
              <View
                className="h-2 rounded-full bg-primary"
                style={{ width: `${levelPercent(reward.value, reward.target)}%` }}
              />
            </View>
            <ThemedText variant="caption">{t.progress(reward.value, reward.target)}</ThemedText>
          </View>
        </>
      )}
    </View>
  );
}
