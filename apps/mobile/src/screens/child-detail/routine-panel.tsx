import type { Routine } from '@math-genius/shared';
import { Button, ThemedText, View } from '@math-genius/ui';

import type { VacationRow } from '@/data/routine-plan';
import { strings } from '@/i18n';
import { dayText, routineLines } from '@/utils/routine-text';

const t = strings.routine;

type RoutinePanelProps = {
  routine: Routine | null;
  vacations: readonly VacationRow[];
  onEdit: () => void;
};

/** The child's routine in a few lines, with the coming holidays. */
export function RoutinePanel({ routine, vacations, onEdit }: RoutinePanelProps) {
  return (
    <View className="gap-3">
      <ThemedText variant="headline" accessibilityRole="header">
        {t.title}
      </ThemedText>
      <View className="gap-1">
        {routine ? (
          routineLines(routine).map((line) => <ThemedText key={line}>{line}</ThemedText>)
        ) : (
          <ThemedText>{t.none}</ThemedText>
        )}
        {vacations.map((vacation) => (
          <ThemedText key={vacation.id} variant="caption">
            {t.vacationLine(dayText(vacation.from_date), dayText(vacation.to_date))}
          </ThemedText>
        ))}
      </View>
      <Button variant="secondary" title={routine ? t.edit : t.set} onPress={onEdit} />
    </View>
  );
}
