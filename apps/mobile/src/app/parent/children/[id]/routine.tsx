import { useLocalSearchParams } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { errorKind } from '@/data/errors';
import { routineOf, vacationsOf } from '@/data/routine-plan';
import { useAddVacation, useRemoveVacation, useRoutines, useSaveRoutine } from '@/data/routines';
import { useLocalClock } from '@/hooks/use-local-clock';
import { RoutineSettings } from '@/screens/routine-settings';

export default function RoutineRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const routines = useRoutines();
  const save = useSaveRoutine(id);
  const addVacation = useAddVacation(id);
  const removeVacation = useRemoveVacation();
  const { date } = useLocalClock();

  // The form starts from the stored routine: wait for it.
  if (!child.data || routines.isPending) return <LoadingScreen />;

  return (
    <RoutineSettings
      routine={routineOf(routines.data, id)}
      onSave={(routine) => save.mutate(routine)}
      saving={save.isPending}
      saved={save.isSuccess}
      saveError={save.error ? errorKind(save.error) : null}
      vacations={vacationsOf(routines.data, id)}
      today={date}
      onAddVacation={(vacation) => addVacation.mutate(vacation)}
      addingVacation={addVacation.isPending}
      vacationError={addVacation.error ? errorKind(addVacation.error) : null}
      removingVacationId={removeVacation.isPending ? removeVacation.variables : null}
      onRemoveVacation={(vacationId) => removeVacation.mutate(vacationId)}
    />
  );
}
