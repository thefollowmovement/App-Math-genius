import { islandKey } from '@math-genius/exercise-engine';
import type { Award } from '@math-genius/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { parseMetrics, type BadgesData } from './badges-model';
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
      const [progress, chests, badges] = await Promise.all([
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
        supabase
          .from('child_badges')
          .select('id', { count: 'exact', head: true })
          .eq('child_id', childId ?? ''),
      ]);
      if (progress.error) throw progress.error;
      if (chests.error) throw chests.error;
      if (badges.error) throw badges.error;
      return {
        progress: progressView(progress.data),
        chests: chests.data,
        badges: badges.count ?? 0,
      };
    },
  });
}

/** Islands whose boss the child has beaten (islandKey), for the world map. */
export function useIslands(childId: string | undefined) {
  return useQuery({
    queryKey: ['rewards', childId, 'islands'],
    enabled: childId !== undefined,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('island_completions')
        .select('grade, domain')
        .eq('child_id', childId ?? '');
      if (error) throw error;
      return data.map(islandKey);
    },
  });
}

/** Badges earned and how far the child is from the others; refreshed with the rewards. */
export function useBadges(childId: string | undefined) {
  return useQuery({
    queryKey: ['rewards', childId, 'badges'],
    enabled: childId !== undefined,
    queryFn: async (): Promise<BadgesData> => {
      const [earned, metrics] = await Promise.all([
        supabase
          .from('child_badges')
          .select('badge_code, earned_at')
          .eq('child_id', childId ?? '')
          .order('earned_at'),
        supabase.rpc('child_badge_metrics', { p_child_id: childId ?? '' }),
      ]);
      if (earned.error) throw earned.error;
      if (metrics.error) throw metrics.error;
      return { earned: earned.data, metrics: parseMetrics(metrics.data) };
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
