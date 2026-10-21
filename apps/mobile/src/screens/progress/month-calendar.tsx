import type { CalendarDay, CalendarStatus } from '@math-genius/shared';
import { Pressable, ThemedText, View, cx } from '@math-genius/ui';

import { Icon } from '@/components/game/icons';
import { calendarWeeks, dayLabel, monthLabel } from '@/data/progress-model';
import { strings } from '@/i18n';

const t = strings.progress.calendar;

/** Green done, orange started, red missed, grey day off or holidays (docs/specs.md). */
const DOTS: Record<CalendarStatus, string> = {
  done: 'bg-success',
  started: 'bg-fire',
  missed: 'bg-danger',
  off: 'bg-muted/40',
  vacation: 'bg-muted/40',
  pending: 'border-2 border-border',
  none: '',
};

const LEGEND: { status: CalendarStatus; label: string }[] = [
  { status: 'done', label: t.legend.done },
  { status: 'started', label: t.legend.started },
  { status: 'missed', label: t.legend.missed },
  { status: 'off', label: t.legend.off },
];

type MonthCalendarProps = {
  month: string;
  days: readonly (CalendarDay & { minutes: number })[];
  onPrevious: () => void;
  /** Missing on the current month. */
  onNext?: () => void;
};

export function MonthCalendar({ month, days, onPrevious, onNext }: MonthCalendarProps) {
  return (
    <View className="gap-3 rounded-lg border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Arrow label={t.previous} icon="back" onPress={onPrevious} />
        <ThemedText variant="headline" accessibilityRole="header">
          {monthLabel(month)}
        </ThemedText>
        <Arrow label={t.next} icon="forward" onPress={onNext} />
      </View>
      <View className="flex-row" importantForAccessibility="no-hide-descendants">
        {t.weekdays.map((letter, index) => (
          <ThemedText key={`${letter}-${index}`} variant="caption" className="flex-1 text-center">
            {letter}
          </ThemedText>
        ))}
      </View>
      {calendarWeeks(days).map((week, row) => (
        <View key={row} className="flex-row">
          {week.map((day, column) =>
            day ? (
              <View
                key={day.date}
                accessible
                accessibilityLabel={t.day(dayLabel(day.date), t.status[day.status], day.minutes)}
                className="flex-1 items-center gap-1 py-1"
              >
                <ThemedText variant="caption" tone="default">
                  {Number(day.date.slice(8, 10))}
                </ThemedText>
                <View className={cx('size-3 rounded-full', DOTS[day.status])} />
              </View>
            ) : (
              <View key={`blank-${column}`} className="flex-1" />
            ),
          )}
        </View>
      ))}
      <View
        className="flex-row flex-wrap gap-x-4 gap-y-1"
        importantForAccessibility="no-hide-descendants"
      >
        {LEGEND.map(({ status, label }) => (
          <View key={status} className="flex-row items-center gap-2">
            <View className={cx('size-3 rounded-full', DOTS[status])} />
            <ThemedText variant="caption">{label}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function Arrow({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: 'back' | 'forward';
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-disabled={!onPress}
      disabled={!onPress}
      onPress={onPress}
      className={cx(
        'size-11 items-center justify-center rounded-full active:opacity-70',
        !onPress && 'opacity-30',
      )}
    >
      <Icon name={icon} color="foreground" />
    </Pressable>
  );
}
