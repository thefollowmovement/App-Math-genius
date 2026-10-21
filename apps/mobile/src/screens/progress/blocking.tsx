import type { BlockingPoint, ProgrammePosition } from '@math-genius/shared';
import { ThemedText, View } from '@math-genius/ui';

import { mistakeView, programmeText } from '@/data/progress-model';
import { strings } from '@/i18n';

const t = strings.progress;

/** « Points de blocage »: where the child struggles this month, each with a real mistake. */
export function BlockingPoints({ points }: { points: readonly BlockingPoint[] }) {
  return (
    <View className="gap-3">
      <ThemedText variant="headline" accessibilityRole="header">
        {t.blocking.title}
      </ThemedText>
      <ThemedText variant="caption">{t.blocking.hint}</ThemedText>
      {points.length === 0 ? <ThemedText>{t.blocking.none}</ThemedText> : null}
      {points.map((point) => {
        const mistake = mistakeView(point);
        return (
          <View key={point.skill} className="gap-2 rounded-lg border border-border bg-surface p-4">
            <ThemedText variant="headline">{point.title}</ThemedText>
            <ThemedText variant="caption">
              {t.blocking.errors(point.errors, point.answered)}
            </ThemedText>
            {point.errorLabel ? (
              <ThemedText tone="fire">{t.blocking.mistake(point.errorLabel)}</ThemedText>
            ) : null}
            {mistake ? (
              <View className="gap-1 rounded-md bg-raised p-3">
                <Line label={t.blocking.prompt} value={mistake.prompt} />
                <Line label={t.blocking.given} value={mistake.given} />
                <Line label={t.blocking.expected} value={mistake.expected} />
              </View>
            ) : (
              <ThemedText variant="caption">{t.blocking.unavailable}</ThemedText>
            )}
          </View>
        );
      })}
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <ThemedText variant="label">{label}</ThemedText>
      <ThemedText>{value}</ThemedText>
    </View>
  );
}

const RANK_TONES = { ahead: 'success', on_track: 'secondary', behind: 'fire' } as const;

/** Where the child stands against their grade's programme at this time of the year. */
export function ProgrammeComparison({
  childName,
  programme,
}: {
  childName: string;
  programme: ProgrammePosition | null;
}) {
  return (
    <View className="gap-3">
      <ThemedText variant="headline" accessibilityRole="header">
        {t.programme.title}
      </ThemedText>
      {!programme || programme.position === null ? (
        <ThemedText variant="caption">{t.programme.none}</ThemedText>
      ) : (
        <View className="gap-2 rounded-lg border border-border bg-surface p-4">
          <ThemedText variant="label" tone={RANK_TONES[programme.position]}>
            {t.programme.ranks[programme.position]}
          </ThemedText>
          {programmeText(childName, programme).map((line) => (
            <ThemedText key={line}>{line}</ThemedText>
          ))}
          <ThemedText variant="caption">{t.programme.note}</ThemedText>
        </View>
      )}
    </View>
  );
}
