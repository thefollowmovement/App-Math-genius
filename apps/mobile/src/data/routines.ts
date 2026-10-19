import type { Routine, Vacation } from '@math-genius/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { localDate } from '@/utils/local-date';

import { ROUTINE_COLUMNS, routineFromRow, routineRow, type Routines } from './routine-plan';
import { useUserId } from './session';

/**
 * A parent gets their family's routines, a paired device its children's (RLS decides). Kept on
 * the device, so that a child starts their session with the right goal offline.
 */
export function useRoutines() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['routines', userId],
    enabled: userId !== undefined,
    queryFn: async (): Promise<Routines> => {
      const [routines, vacations] = await Promise.all([
        supabase.from('routines').select(ROUTINE_COLUMNS),
        supabase
          .from('vacations')
          .select('id, child_id, from_date, to_date')
          .gte('to_date', localDate())
          .order('from_date'),
      ]);
      if (routines.error) throw routines.error;
      if (vacations.error) throw vacations.error;
      return {
        routines: Object.fromEntries(
          routines.data.flatMap((row) => {
            const routine = routineFromRow(row);
            return routine ? [[row.child_id, routine]] : [];
          }),
        ),
        vacations: vacations.data,
      };
    },
  });
}

function useRefreshRoutines() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['routines'] });
}

export function useSaveRoutine(childId: string) {
  const onSuccess = useRefreshRoutines();
  return useMutation({
    mutationFn: async (routine: Routine) => {
      const { error } = await supabase
        .from('routines')
        .upsert(routineRow(childId, routine), { onConflict: 'child_id' });
      if (error) throw error;
    },
    onSuccess,
  });
}

export function useAddVacation(childId: string) {
  const onSuccess = useRefreshRoutines();
  return useMutation({
    mutationFn: async ({ fromDate, toDate }: Vacation) => {
      const { error } = await supabase
        .from('vacations')
        .insert({ child_id: childId, from_date: fromDate, to_date: toDate });
      if (error) throw error;
    },
    onSuccess,
  });
}

export function useRemoveVacation() {
  const onSuccess = useRefreshRoutines();
  return useMutation({
    mutationFn: async (vacationId: string) => {
      const { error } = await supabase.from('vacations').delete().eq('id', vacationId);
      if (error) throw error;
    },
    onSuccess,
  });
}
