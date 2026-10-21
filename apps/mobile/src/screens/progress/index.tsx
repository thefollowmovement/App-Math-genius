import type { ChildProgress, Grade, ProgressRange } from '@math-genius/shared';
import { ActivityIndicator, Button, Screen, ThemedText, View } from '@math-genius/ui';

import type { MonthlyRecapRow } from '@/data/progress';
import { strings } from '@/i18n';

import { BlockingPoints, ProgrammeComparison } from './blocking';
import { Curves } from './curves';
import { DomainBars, SkillLists } from './mastery';
import { MonthCalendar } from './month-calendar';
import { RecapsList } from './recaps-list';
import { VerdictCard } from './verdict-card';

const t = strings.progress;

type ProgressProps = {
  childName: string;
  grade: Grade;
  /** Missing while loading. */
  progress?: ChildProgress;
  error: boolean;
  onRetry: () => void;
  range: ProgressRange;
  onRange: (range: ProgressRange) => void;
  /** The calendar's month (its first day). */
  month: string;
  onMonth: (month: 'previous' | 'next') => void;
  /** No month after the current one. */
  canGoNext: boolean;
  recaps: readonly MonthlyRecapRow[];
  onOpenRecap: (recapId: string) => void;
  openingRecapId: string | null;
  recapError: boolean;
  onOpenSettings: () => void;
};

/**
 * The parent's « Progrès » page (docs/specs.md, Statistiques et récaps): whether it goes well in
 * 10 seconds (the verdict on top), where the child struggles in a minute (the calendar, the
 * curves, mastery, the points of difficulty and the programme), then the monthly recaps.
 */
export function Progress({
  childName,
  grade,
  progress,
  error,
  onRetry,
  range,
  onRange,
  month,
  onMonth,
  canGoNext,
  recaps,
  onOpenRecap,
  openingRecapId,
  recapError,
  onOpenSettings,
}: ProgressProps) {
  if (!progress) {
    return (
      <Screen centered>
        {error ? (
          <View className="gap-4">
            <ThemedText tone="danger">{t.error}</ThemedText>
            <Button variant="secondary" title={t.retry} onPress={onRetry} />
          </View>
        ) : (
          <View className="items-center gap-3" accessibilityLiveRegion="polite">
            <ActivityIndicator />
            <ThemedText variant="caption">{t.loading}</ThemedText>
          </View>
        )}
      </Screen>
    );
  }
  return (
    <Screen>
      <VerdictCard childName={childName} verdict={progress.verdict} />
      <View className="gap-3">
        <ThemedText variant="headline" accessibilityRole="header">
          {t.calendar.title}
        </ThemedText>
        <MonthCalendar
          month={month}
          days={progress.calendar.days}
          onPrevious={() => onMonth('previous')}
          onNext={canGoNext ? () => onMonth('next') : undefined}
        />
      </View>
      <View className="gap-3">
        <ThemedText variant="headline" accessibilityRole="header">
          {t.curves.title}
        </ThemedText>
        <Curves series={progress.series} range={range} onRange={onRange} />
      </View>
      <DomainBars domains={progress.domains} grade={grade} />
      <BlockingPoints points={progress.blocking} />
      <SkillLists skills={progress.skills} />
      <ProgrammeComparison childName={childName} programme={progress.programme} />
      <RecapsList
        recaps={recaps}
        onOpen={onOpenRecap}
        openingId={openingRecapId}
        error={recapError}
        onOpenSettings={onOpenSettings}
      />
    </Screen>
  );
}
