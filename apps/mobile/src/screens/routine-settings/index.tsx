import type { Routine, Vacation } from '@math-genius/shared';
import { Screen } from '@math-genius/ui';

import type { ErrorKind } from '@/data/errors';
import type { VacationRow } from '@/data/routine-plan';

import { RoutineForm } from './routine-form';
import { VacationsPanel } from './vacations-panel';

type RoutineSettingsProps = {
  routine: Routine | null;
  onSave: (routine: Routine) => void;
  saving: boolean;
  saved: boolean;
  saveError: ErrorKind | null;
  vacations: readonly VacationRow[];
  /** "YYYY-MM-DD" */
  today: string;
  onAddVacation: (vacation: Vacation) => void;
  addingVacation: boolean;
  vacationError: ErrorKind | null;
  removingVacationId: string | null;
  onRemoveVacation: (vacationId: string) => void;
};

/** The child's routine (days, times, goal) and holidays, set by a parent. */
export function RoutineSettings(props: RoutineSettingsProps) {
  return (
    <Screen>
      <RoutineForm
        routine={props.routine}
        onSubmit={props.onSave}
        saving={props.saving}
        saved={props.saved}
        error={props.saveError}
      />
      <VacationsPanel
        vacations={props.vacations}
        today={props.today}
        onAdd={props.onAddVacation}
        adding={props.addingVacation}
        error={props.vacationError}
        removingId={props.removingVacationId}
        onRemove={props.onRemoveVacation}
      />
    </Screen>
  );
}
