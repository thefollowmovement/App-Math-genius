import { ThemedText, View, cx } from '@math-genius/ui';

import { ProgressBar } from '@/components/game/progress-bar';
import type { ParentRewardView } from '@/data/parent-rewards-model';
import { strings } from '@/i18n';

const t = strings.parentRewards;

/** The parent's reward to ask for, or the closest one to unlock, on the child's home. */
export function NextRewardCard({
  reward,
  className,
}: {
  reward: ParentRewardView;
  className?: string;
}) {
  const unlocked = reward.status === 'unlocked';
  return (
    <View
      className={cx(
        'gap-2 rounded-lg border-2 bg-surface p-4',
        unlocked ? 'border-success glow-success' : 'border-border',
        className,
      )}
    >
      <ThemedText variant="label" tone="success">
        {t.child.label}
      </ThemedText>
      <ThemedText>{reward.title}</ThemedText>
      {unlocked ? (
        <ThemedText variant="caption" tone="success" accessibilityLiveRegion="polite">
          {t.child.unlocked}
        </ThemedText>
      ) : (
        <>
          <ProgressBar
            value={reward.target > 0 ? reward.value / reward.target : 0}
            fill="success"
            size="sm"
            label={t.child.title}
            valueText={t.child.progressLabel(reward.value, reward.target)}
          />
          <ThemedText variant="caption">
            {t.child.remaining[reward.goal](Math.max(0, reward.target - reward.value))}
          </ThemedText>
        </>
      )}
    </View>
  );
}
