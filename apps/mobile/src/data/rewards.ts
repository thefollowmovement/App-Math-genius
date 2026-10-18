import type { Award } from '@math-genius/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { queryClient } from './query-client';
import {
  awardsFromResponse,
  parseAward,
  parseOpenedChest,
  progressView,
  type OpenedChest,
  type Rewards,
} from './rewards-model';

/**
 * Asks the server to award the child's finished sessions: it grades every answer again, then
 * computes XP, gems, streak and chest (supabase/functions/award-session). Safe to call often.
 */
export async function requestAwards(childId: string): Promise<Award[]> {
  const { data, error } = await supabase.functions.invoke('award-session', {
    body: { child_id: childId },
  });
  if (error) throw error;
  const awards = awardsFromResponse(data);
  for (const award of awards) queryClient.setQueryData(['award', award.session_id], award);
  if (awards.length > 0) void queryClient.invalidateQueries({ queryKey: ['rewards', childId] });
  return awards;
}

/** XP, level, gems, streak and chests to open. Kept on the device, to show them offline. */
export function useRewards(childId: string | undefined) {
  return useQuery({
    queryKey: ['rewards', childId],
    enabled: childId !== undefined,
    queryFn: async (): Promise<Rewards> => {
      const [progress, chests] = await Promise.all([
        supabase
          .from('progress')
          .select('xp, gems, streak_current, streak_best, freezes')
          .eq('child_id', childId ?? '')
          .maybeSingle(),
        supabase
          .from('chests')
          .select('id, kind')
          .eq('child_id', childId ?? '')
          .is('opened_at', null)
          .order('created_at'),
      ]);
      if (progress.error) throw progress.error;
      if (chests.error) throw chests.error;
      return { progress: progressView(progress.data), chests: chests.data };
    },
  });
}

/** A session's award, once the server has computed it. */
export function useSessionAward(sessionId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['award', sessionId],
    enabled: enabled && sessionId !== undefined,
    queryFn: async (): Promise<Award | null> => {
      const { data, error } = await supabase
        .from('sessions')
        .select('award')
        .eq('id', sessionId ?? '')
        .maybeSingle();
      if (error) throw error;
      return parseAward(data?.award);
    },
    // Until the award arrives (requested right after the session is sent).
    refetchInterval: (query) => (query.state.data ? false : 3000),
  });
}

export function useOpenChest(childId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (chestId: string): Promise<OpenedChest> => {
      const { data, error } = await supabase.rpc('open_chest', { p_chest_id: chestId });
      if (error) throw error;
      const opened = parseOpenedChest(data);
      if (!opened) throw new Error('Unexpected open_chest answer');
      return opened;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['rewards', childId] }),
  });
}
