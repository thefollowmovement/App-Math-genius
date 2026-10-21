import { PROGRESS_RANGES, type ChildProgress, type ProgressRange } from '@math-genius/shared';
import { Pressable, ThemedText, View, cx } from '@math-genius/ui';

import { BarChart, LineChart } from '@/components/charts';
import { progressCharts } from '@/data/progress-model';
import { strings } from '@/i18n';

const t = strings.progress.curves;

type CurvesProps = {
  series: ChildProgress['series'];
  range: ProgressRange;
  onRange: (range: ProgressRange) => void;
};

/** Time, success and XP over a week, a month or a quarter. */
export function Curves({ series, range, onRange }: CurvesProps) {
  const charts = progressCharts(series);
  return (
    <View className="gap-4 rounded-lg border border-border bg-surface p-4">
      <View className="flex-row gap-1" accessibilityRole="tablist">
        {PROGRESS_RANGES.map((option) => {
          const on = option === range;
          return (
            <Pressable
              key={option}
              accessibilityRole="tab"
              aria-selected={on}
              onPress={() => onRange(option)}
              className={cx(
                'h-11 flex-1 items-center justify-center rounded-md border active:opacity-80',
                on ? 'border-primary bg-primary' : 'border-border bg-background',
              )}
            >
              <ThemedText variant="caption" tone={on ? 'onPrimary' : 'default'}>
                {t.ranges[option]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {charts.empty ? <ThemedText variant="caption">{t.empty}</ThemedText> : null}
      <BarChart
        title={t.time[charts.unit]}
        summary={t.timeTotal(charts.totals.minutes)}
        points={charts.time}
      />
      <LineChart
        title={t.success[charts.unit]}
        summary={t.successTotal(charts.totals.success)}
        points={charts.success}
      />
      <BarChart
        title={t.xp[charts.xpUnit]}
        summary={t.xpTotal(charts.totals.xp)}
        points={charts.xp}
        fill="accent"
      />
    </View>
  );
}
