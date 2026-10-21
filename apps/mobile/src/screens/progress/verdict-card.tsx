import type { Verdict, VerdictLevel } from '@math-genius/shared';
import { ThemedText, View, cx, type ThemedTextTone } from '@math-genius/ui';

import { verdictSentence } from '@/data/progress-model';
import { strings } from '@/i18n';

const t = strings.progress.verdict;

/** Green, orange, red, or grey without a verdict. */
export const VERDICT_STYLES: Record<
  VerdictLevel,
  { dot: string; tone: ThemedTextTone; border: string }
> = {
  good: { dot: 'bg-success', tone: 'success', border: 'border-success' },
  watch: { dot: 'bg-fire', tone: 'fire', border: 'border-fire' },
  alert: { dot: 'bg-danger', tone: 'danger', border: 'border-danger' },
  none: { dot: 'bg-muted/40', tone: 'muted', border: 'border-border' },
};

/** « Ça va ? » in 10 seconds: a colored light, a title and one sentence. */
export function VerdictCard({ childName, verdict }: { childName: string; verdict: Verdict }) {
  const style = VERDICT_STYLES[verdict.level];
  return (
    <View
      accessible
      accessibilityRole="summary"
      className={cx('gap-2 rounded-lg border-2 bg-surface p-4', style.border)}
    >
      <ThemedText variant="label">{t.label}</ThemedText>
      <View className="flex-row items-center gap-3">
        <View className={cx('size-5 rounded-full', style.dot)} />
        <ThemedText variant="headline" tone={style.tone} className="flex-1">
          {t.title[verdict.level]}
        </ThemedText>
      </View>
      <ThemedText>{verdictSentence(childName, verdict)}</ThemedText>
    </View>
  );
}
