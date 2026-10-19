import { islandKey } from '@math-genius/exercise-engine';
import type { Award, ShopItemCode } from '@math-genius/shared';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { parseMetrics, type BadgesData } from './badges-model';
import { queryClient, refetchAfterWrite } from './query-client';
import {
  awardsFromResponse,
  parseAward,
  parseOpenedChest,
  parseWeeklyChallenge,
  progressView,
  type OpenedChest,
  type Rewards,
  type WeeklyChallenge,
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

/**
 * XP, level, gems, streak, chests to open, items bought and cosmetics kept. Kept on the device,
 * to show them offline.
 */
export function useRewards(childId: string | undefined) {
  return useQuery({
    queryKey: ['rewards', childId],
    enabled: childId !== undefined,
    queryFn: async (): Promise<Rewards> => {
      const [progress, chests, badges, items, kept] = await Promise.all([
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
        supabase
          .from('child_items')
          .select('item_code, equipped')
          .eq('child_id', childId ?? '')
          .order('bought_at'),
        supabase
          .from('child_cosmetics')
          .select('cosmetic_id')
          .eq('child_id', childId ?? ''),
      ]);
      if (progress.error) throw progress.error;
      if (chests.error) throw chests.error;
      if (badges.error) throw badges.error;
      if (items.error) throw items.error;
      if (kept.error) throw kept.error;
      return {
        progress: progressView(progress.data),
        chests: chests.data,
        badges: badges.count ?? 0,
        items: items.data,
        kept: kept.data.map(({ cosmetic_id }) => cosmetic_id),
      };
    },
  });
}

/** This week's challenge and how far the child is (computed by the server). */
export function useWeeklyChallenge(childId: string | undefined) {
  return useQuery({
    queryKey: ['rewards', childId, 'challenge'],
    enabled: childId !== undefined,
    queryFn: async (): Promise<WeeklyChallenge | null> => {
      const { data, error } = await supabase.rpc('weekly_challenge', { p_child_id: childId ?? '' });
      if (error) throw error;
      return parseWeeklyChallenge(data);
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

/** Buys an item of the shop with gems (the child then wears it). */
export function useBuyItem(childId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (code: ShopItemCode) => {
      const { error } = await supabase.rpc('buy_item', { p_child_id: childId, p_item_code: code });
      if (error) throw error;
    },
    // A companion or an accessory is worn by the hero: the child's avatar changes too.
    onSuccess: () => wornChanged(client, childId),
  });
}

/** Wears an item bought earlier (instead of the other one of its kind), or takes it off. */
export function useWearItem(childId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, wear }: { code: ShopItemCode; wear: boolean }) => {
      const { error } = await supabase.rpc('equip_item', {
        p_child_id: childId,
        p_item_code: code,
        p_equipped: wear,
      });
      if (error) throw error;
    },
    onSuccess: () => wornChanged(client, childId),
  });
}

const wornChanged = (client: QueryClient, childId: string) =>
  Promise.all([
    client.invalidateQueries({ queryKey: ['rewards', childId] }),
    refetchAfterWrite(client, ['children']),
  ]);

/** Buys a streak freeze (FREEZE_PRICE gems, MAX_FREEZES at most). */
export function useBuyFreeze(childId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('buy_freeze', { p_child_id: childId });
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['rewards', childId] }),
  });
}
