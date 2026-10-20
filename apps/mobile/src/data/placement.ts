import type { Tables } from '@math-genius/shared';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type PlacementSessionRow = Pick<
  Tables<'sessions'>,
  'id' | 'grade' | 'started_at' | 'completed_at'
>;

export type PlacementAttemptRow = Pick<
  Tables<'attempts'>,
  | 'position'
  | 'skill_code'
  | 'generator_id'
  | 'difficulty'
  | 'is_correct'
  | 'verified'
  | 'answered_at'
>;

export type PlacementRows = {
  /** The last test finished, with its answers. */
  finished: { session: PlacementSessionRow; attempts: PlacementAttemptRow[] } | null;
  /** A newer test is under way on the child's device. */
  inProgress: boolean;
};

/**
 * The child's last placement test, for the parent: its answers are read again with the engine
 * (data/placement-report.ts). Under the `sessions` key, so that the live sessions refresh it.
 */
export function usePlacement(childId: string | undefined) {
  return useQuery({
    queryKey: ['sessions', 'placement', childId],
    enabled: childId !== undefined,
    queryFn: async (): Promise<PlacementRows> => {
      const sessions = await supabase
        .from('sessions')
        .select('id, grade, started_at, completed_at')
        .eq('child_id', childId ?? '')
        .eq('kind', 'placement')
        .order('started_at', { ascending: false })
        .limit(2);
      if (sessions.error) throw sessions.error;
      const [latest, previous] = sessions.data;
      const inProgress = latest !== undefined && latest.completed_at === null;
      const session = inProgress ? previous : latest;
      if (!session?.completed_at) return { finished: null, inProgress };
      const attempts = await supabase
        .from('attempts')
        .select('position, skill_code, generator_id, difficulty, is_correct, verified, answered_at')
        .eq('session_id', session.id)
        .order('position');
      if (attempts.error) throw attempts.error;
      return { finished: { session, attempts: attempts.data }, inProgress };
    },
  });
}
