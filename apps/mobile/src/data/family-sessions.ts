import type { Tables } from '@math-genius/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { localDate } from '@/utils/local-date';

export type SessionRow = Pick<
  Tables<'sessions'>,
  | 'id'
  | 'child_id'
  | 'kind'
  | 'local_date'
  | 'started_at'
  | 'completed_at'
  | 'answered'
  | 'score'
  | 'duration_s'
  | 'goal_met'
  | 'flagged'
>;

export type AttemptRow = Pick<
  Tables<'attempts'>,
  | 'position'
  | 'skill_code'
  | 'generator_id'
  | 'difficulty'
  | 'seed'
  | 'answer'
  | 'is_correct'
  | 'hint_used'
  | 'time_ms'
>;

const SESSION_COLUMNS =
  'id, child_id, kind, local_date, started_at, completed_at, answered, score, duration_s, goal_met, flagged';

/** Today's sessions of the family's children (RLS keeps the parent to their own family). */
export function useTodaySessions() {
  const day = localDate();
  return useQuery({
    queryKey: ['sessions', 'day', day],
    queryFn: async (): Promise<SessionRow[]> => {
      const { data, error } = await supabase
        .from('sessions')
        .select(SESSION_COLUMNS)
        .eq('local_date', day)
        .order('started_at');
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Keeps the sessions up to date while children play: a device syncs after every answer, and
 * Realtime forwards the change (only for the parent's children, RLS applies).
 */
export function useLiveSessions(enabled: boolean) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    const channel = supabase
      .channel('family-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, refresh)
      // A change made before the subscription was ready would otherwise be missed.
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') refresh();
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
}

export function useSessionDetail(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['sessions', 'detail', sessionId],
    enabled: sessionId !== undefined,
    queryFn: async () => {
      const [session, attempts] = await Promise.all([
        supabase
          .from('sessions')
          .select(SESSION_COLUMNS)
          .eq('id', sessionId ?? '')
          .single(),
        supabase
          .from('attempts')
          .select(
            'position, skill_code, generator_id, difficulty, seed, answer, is_correct, hint_used, time_ms',
          )
          .eq('session_id', sessionId ?? '')
          .order('position'),
      ]);
      if (session.error) throw session.error;
      if (attempts.error) throw attempts.error;
      return { session: session.data, attempts: attempts.data };
    },
  });
}
