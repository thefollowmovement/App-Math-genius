import { Button, ThemedText, View } from '@math-genius/ui';

import type { MonthlyRecapRow } from '@/data/progress';
import { monthName } from '@/data/progress-model';
import { strings } from '@/i18n';

const t = strings.progress.recaps;

type RecapsListProps = {
  recaps: readonly MonthlyRecapRow[];
  onOpen: (recapId: string) => void;
  openingId: string | null;
  error: boolean;
  onOpenSettings: () => void;
};

/** The monthly recaps, each with its PDF, and the way to the recap settings. */
export function RecapsList({ recaps, onOpen, openingId, error, onOpenSettings }: RecapsListProps) {
  return (
    <View className="gap-3">
      <ThemedText variant="headline" accessibilityRole="header">
        {t.title}
      </ThemedText>
      {recaps.length === 0 ? <ThemedText variant="caption">{t.none}</ThemedText> : null}
      {recaps.map((recap) => {
        const month = monthName(recap.periodStart);
        return (
          <View
            key={recap.id}
            className="flex-row items-center gap-3 rounded-lg border border-border bg-surface p-4"
          >
            <ThemedText className="flex-1">{t.item(month)}</ThemedText>
            <Button
              variant="secondary"
              title={t.download}
              accessibilityLabel={t.downloadLabel(month)}
              loading={openingId === recap.id}
              onPress={() => onOpen(recap.id)}
            />
          </View>
        );
      })}
      {error ? (
        <ThemedText tone="danger" accessibilityLiveRegion="polite">
          {t.error}
        </ThemedText>
      ) : null}
      <Button variant="outline" title={t.settings} onPress={onOpenSettings} />
    </View>
  );
}
