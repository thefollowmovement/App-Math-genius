import { Button, Screen, ThemedText, View } from '@math-genius/ui';

import type { SessionSummary as Summary } from '@/data/practice/summary';
import type { AwardState } from '@/data/rewards-model';
import { strings } from '@/i18n';

import { AwardPanel } from './rewards/award-panel';

const t = strings.summary;

type SessionSummaryProps = {
  summary: Summary;
  /** The session reached the server; otherwise it waits on the device. */
  saved: boolean;
  /** XP, streak and chest, computed by the server once the session is sent. */
  award: AwardState;
  onOpenChest: (chestId: string) => void;
  onOpenBadges: () => void;
  onBonus: () => void;
  onHome: () => void;
};

export function SessionSummary({
  summary,
  saved,
  award,
  onOpenChest,
  onOpenBadges,
  onBonus,
  onHome,
}: SessionSummaryProps) {
  return (
    <Screen centered>
      <View className="gap-2">
        <ThemedText variant="display" className="text-center" accessibilityRole="header">
          {summary.kind === 'boss' ? t.bossOver : summary.goalMet ? t.goalMet : t.finished}
        </ThemedText>
        <ThemedText variant="headline" className="text-center">
          {t.score(summary.correct, summary.answered)}
        </ThemedText>
        <ThemedText className="text-center">{t.duration(summary.minutes)}</ThemedText>
        {summary.goalMet || summary.kind === 'boss' ? null : (
          <ThemedText className="text-center">{t.notValidated}</ThemedText>
        )}
      </View>
      <AwardPanel state={award} onOpenChest={onOpenChest} onOpenBadges={onOpenBadges} />
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
