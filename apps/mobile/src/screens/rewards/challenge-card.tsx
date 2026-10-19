import { ThemedText, View, cx } from '@math-genius/ui';

import { ProgressBar } from '@/components/game/progress-bar';
import type { WeeklyChallenge } from '@/data/rewards-model';
import { strings } from '@/i18n';

const t = strings.challenge;

/** This week's challenge, on the child's home. */
export function ChallengeCard({
  challenge,
  className,
}: {
  challenge: WeeklyChallenge;
  className?: string;
}) {
  const { progress, threshold, completed } = challenge;
  return (
    <View
      accessible
      accessibilityLabel={
        completed
          ? `${t.title}\u00a0: ${t.done}`
          : t.cardLabel(t.items[challenge.code], progress, threshold, challenge.gems)
      }
      className={cx(
        'gap-2 rounded-lg border-2 bg-surface p-4',
        completed ? 'border-success' : 'border-border',
        className,
      )}
    >
      <ThemedText variant="label" tone="accent">
        {t.title}
      </ThemedText>
      <ThemedText>{t.names[challenge.code]}</ThemedText>
      {completed ? (
        <ThemedText variant="caption" tone="success">
          {t.doneShort}
        </ThemedText>
      ) : (
        <>
          <ProgressBar
            value={threshold > 0 ? progress / threshold : 0}
            fill="accent"
            size="sm"
            label={t.title}
            valueText={t.progressLabel(progress, threshold)}
          />
          <ThemedText variant="caption">{t.progress(progress, threshold)}</ThemedText>
        </>
      )}
    </View>
  );
}
