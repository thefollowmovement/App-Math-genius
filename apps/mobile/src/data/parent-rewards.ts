import type { ParentRewardInput } from '@math-genius/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { ParentRewardRow } from './parent-rewards-model';

/**
 * The parent's rewards for a child, kept with the other rewards (refreshed by awards and, on the
 * parent's side, by Realtime on progress).
 */
export function useParentRewards(childId: string | undefined) {
  return useQuery({
    queryKey: ['rewards', childId, 'parent'],
    enabled: childId !== undefined,
    queryFn: async (): Promise<ParentRewardRow[]> => {
      const { data, error } = await supabase
        .from('parent_rewards')
        .select('id, title, goal, target, unlocked_at, given_at')
        .eq('child_id', childId ?? '')
        .order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

/** The parent sets a reward (the server unlocks it right away if its goal is already reached). */
export function useCreateParentReward(childId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (reward: ParentRewardInput) => {
      const { error } = await supabase
        .from('parent_rewards')
        .insert({ child_id: childId, ...reward });
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['rewards', childId, 'parent'] }),
  });
}

export function useRemoveParentReward(childId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase.from('parent_rewards').delete().eq('id', rewardId);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['rewards', childId, 'parent'] }),
  });
}

/** The parent hands an unlocked reward over. */
export function useGiveParentReward(childId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase.rpc('give_parent_reward', { p_reward_id: rewardId });
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['rewards', childId, 'parent'] }),
  });
}
