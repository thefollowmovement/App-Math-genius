import { ThemedText, View, cx } from '@math-genius/ui';

import type { WeeklyChallenge } from '@/data/rewards-model';
import { strings } from '@/i18n';
import { levelPercent } from '@/utils/reward-text';

const t = strings.challenge;

/** This week's challenge, on the child's home. */
export function ChallengeCard({ challenge }: { challenge: WeeklyChallenge }) {
  return (
    <View
      className={cx(
        'gap-2 rounded-lg border bg-surface p-4',
        challenge.completed ? 'border-success' : 'border-border',
      )}
    >
      <ThemedText variant="headline">{`${t.icon} ${t.title}`}</ThemedText>
      <ThemedText>{t.items[challenge.code]}</ThemedText>
      {challenge.completed ? (
        <ThemedText variant="caption" tone="default">
          {t.done}
        </ThemedText>
      ) : (
        <>
          <View className="flex-row items-center gap-2">
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={t.progressLabel(challenge.progress, challenge.threshold)}
              accessibilityValue={{ min: 0, max: challenge.threshold, now: challenge.progress }}
              className="h-2 flex-1 overflow-hidden rounded-full bg-background"
            >
              <View
                className="h-2 rounded-full bg-primary"
                style={{ width: `${levelPercent(challenge.progress, challenge.threshold)}%` }}
              />
            </View>
            <ThemedText variant="caption">
              {t.progress(challenge.progress, challenge.threshold)}
            </ThemedText>
          </View>
          <ThemedText variant="caption">{t.reward(challenge.gems)}</ThemedText>
        </>
      )}
    </View>
  );
}
