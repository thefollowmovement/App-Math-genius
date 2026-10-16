import { WEEKDAYS, type Weekday } from '@math-genius/shared';
import { Pressable, ThemedText, View } from '@math-genius/ui';

import { strings } from '@/i18n';

const t = strings.routine;

type WeekdayPickerProps = {
  label: string;
  days: readonly number[];
  onChange: (days: number[]) => void;
  error?: string;
};

/** One toggle per weekday, Monday first. */
export function WeekdayPicker({ label, days, onChange, error }: WeekdayPickerProps) {
  const toggle = (day: Weekday) =>
    onChange(
      days.includes(day)
        ? days.filter((other) => other !== day)
        : [...days, day].sort((a, b) => a - b),
    );

  return (
    <View className="gap-2">
      <ThemedText variant="caption" tone="default">
        {label}
      </ThemedText>
      <View className="flex-row gap-1">
        {WEEKDAYS.map((day) => {
          const on = days.includes(day);
          return (
            <Pressable
              key={day}
              accessibilityRole="checkbox"
              accessibilityLabel={t.weekdays[day - 1]}
              accessibilityState={{ checked: on }}
              onPress={() => toggle(day)}
              className={
                on
                  ? 'h-12 flex-1 items-center justify-center rounded-md border border-primary bg-primary active:opacity-80'
                  : 'h-12 flex-1 items-center justify-center rounded-md border border-border bg-surface active:opacity-80'
              }
            >
              <ThemedText variant="caption" tone={on ? 'onPrimary' : 'default'}>
                {t.shortWeekdays[day - 1]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <ThemedText variant="caption" tone="danger">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
