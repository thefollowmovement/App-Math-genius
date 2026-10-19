import { errorKind } from '@/data/errors';
import {
  useCreateParentReward,
  useGiveParentReward,
  useParentRewards,
  useRemoveParentReward,
} from '@/data/parent-rewards';
import { rewardViews, standing } from '@/data/parent-rewards-model';
import { useIslands, useRewards } from '@/data/rewards';
import type { ParentRewardsState } from '@/screens/child-detail';

/** The parent's rewards for a child, with the child's progress towards them. */
export function useParentRewardsPanel(childId: string): ParentRewardsState {
  const rows = useParentRewards(childId);
  const rewards = useRewards(childId);
  const islands = useIslands(childId);
  const create = useCreateParentReward(childId);
  const give = useGiveParentReward(childId);
  const remove = useRemoveParentReward(childId);
  const failed = create.error ?? give.error ?? remove.error;
  return {
    rewards: rewardViews(
      rows.data ?? [],
      standing(rewards.data?.progress, islands.data?.length ?? 0),
    ),
    creating: create.isPending,
    busyId: give.isPending ? give.variables : remove.isPending ? remove.variables : null,
    error: failed ? errorKind(failed) : null,
    onCreate: (reward) => create.mutate(reward),
    onGive: (rewardId) => give.mutate(rewardId),
    onRemove: (rewardId) => remove.mutate(rewardId),
  };
}
