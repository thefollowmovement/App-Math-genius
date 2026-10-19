import { Button, Screen, ThemedText, View } from '@math-genius/ui';

import type { SessionSummary as Summary } from '@/data/practice/summary';
import { strings } from '@/i18n';

const t = strings.summary;

type SessionSummaryProps = {
  summary: Summary;
  /** The session reached the server; otherwise it waits on the device. */
  saved: boolean;
  onBonus: () => void;
  onHome: () => void;
};

export function SessionSummary({ summary, saved, onBonus, onHome }: SessionSummaryProps) {
  return (
    <Screen centered>
      <View className="gap-2">
        <ThemedText variant="display" className="text-center" accessibilityRole="header">
          {summary.goalMet ? t.goalMet : t.finished}
        </ThemedText>
        <ThemedText variant="headline" className="text-center">
          {t.score(summary.correct, summary.answered)}
        </ThemedText>
        <ThemedText className="text-center">{t.duration(summary.minutes)}</ThemedText>
        {summary.goalMet ? null : <ThemedText className="text-center">{t.notValidated}</ThemedText>}
      </View>
      {summary.progressed.length > 0 ? (
        <View className="gap-2 rounded-lg border border-border bg-surface p-4">
          <ThemedText variant="headline">{t.progressed}</ThemedText>
          {summary.progressed.map(({ title, mastery }) => (
            <ThemedText key={title}>{t.mastery(title, mastery)}</ThemedText>
          ))}
        </View>
      ) : null}
      <ThemedText variant="caption" className="text-center">
        {saved ? t.saved : t.savedOffline}
      </ThemedText>
      <View className="gap-3">
        <Button size="lg" title={t.bonus} onPress={onBonus} />
        <Button variant="ghost" title={t.home} onPress={onHome} />
      </View>
    </Screen>
  );
}
