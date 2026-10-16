import { Picker } from '@expo/ui';
import { MAX_VACATION_DAYS, type Vacation } from '@math-genius/shared';
import { Button, ThemedText, View } from '@math-genius/ui';
import { useState } from 'react';

import { ErrorMessage } from '@/components/error-message';
import { PickerField } from '@/components/picker-field';
import type { ErrorKind } from '@/data/errors';
import type { VacationRow } from '@/data/routine-plan';
import { strings } from '@/i18n';
import { dayOptionText, dayText, nextDays } from '@/utils/routine-text';

const t = strings.routine.vacations;

/** Holidays start within this many days from today. */
const PLANNING_DAYS = 180;
/** A week of holidays to begin with. */
const DEFAULT_DAYS = 7;

type VacationsPanelProps = {
  vacations: readonly VacationRow[];
  /** "YYYY-MM-DD" */
  today: string;
  onAdd: (vacation: Vacation) => void;
  adding: boolean;
  error: ErrorKind | null;
  removingId: string | null;
  onRemove: (vacationId: string) => void;
};

/** Holiday periods coming up, and a form to add one. */
export function VacationsPanel({
  vacations,
  today,
  onAdd,
  adding,
  error,
  removingId,
  onRemove,
}: VacationsPanelProps) {
  const [fromDate, setFromDate] = useState(today);
  const [length, setLength] = useState(DEFAULT_DAYS);
  const toOptions = nextDays(fromDate, MAX_VACATION_DAYS);
  const toDate = toOptions[length - 1] ?? fromDate;

  return (
    <View className="gap-4">
      <ThemedText variant="headline" accessibilityRole="header">
        {t.title}
      </ThemedText>
      <ThemedText variant="caption">{t.intro}</ThemedText>
      {vacations.length === 0 ? <ThemedText>{t.empty}</ThemedText> : null}
      {vacations.map((vacation) => {
        const period = t.period(dayText(vacation.from_date), dayText(vacation.to_date));
        return (
          <View
            key={vacation.id}
            className="flex-row items-center gap-4 rounded-lg border border-border bg-surface p-4"
          >
            <ThemedText className="flex-1">{period}</ThemedText>
            <Button
              variant="danger"
              title={t.remove}
              accessibilityLabel={t.removeLabel(period)}
              loading={removingId === vacation.id}
              onPress={() => onRemove(vacation.id)}
            />
          </View>
        );
      })}
      <PickerField label={t.from}>
        <Picker<string> selectedValue={fromDate} onValueChange={setFromDate} testID="vacation-from">
          {nextDays(today, PLANNING_DAYS).map((date) => (
            <Picker.Item key={date} label={dayOptionText(date)} value={date} />
          ))}
        </Picker>
      </PickerField>
      <PickerField label={t.to}>
        <Picker<string>
          selectedValue={toDate}
          onValueChange={(date) => setLength(toOptions.indexOf(date) + 1)}
          testID="vacation-to"
        >
          {toOptions.map((date) => (
            <Picker.Item key={date} label={dayOptionText(date)} value={date} />
          ))}
        </Picker>
      </PickerField>
      <ErrorMessage kind={error} />
      <Button
        variant="secondary"
        title={t.add}
        loading={adding}
        onPress={() => onAdd({ fromDate, toDate })}
      />
    </View>
  );
}
