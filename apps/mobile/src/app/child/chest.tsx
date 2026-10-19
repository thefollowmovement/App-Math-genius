import { useLocalSearchParams, useRouter } from 'expo-router';

import { errorKind } from '@/data/errors';
import { useOpenChest, useRewards } from '@/data/rewards';
import { ChestOpening } from '@/screens/chest-opening';

export default function ChestRoute() {
  const router = useRouter();
  const { id, chest } = useLocalSearchParams<{ id: string; chest: string }>();
  const rewards = useRewards(id);
  const open = useOpenChest(id);
  const kind = rewards.data?.chests.find((candidate) => candidate.id === chest)?.kind ?? 'common';

  return (
    <ChestOpening
      kind={open.data?.kind ?? kind}
      opened={open.data ?? null}
      opening={open.isPending}
      error={open.error ? errorKind(open.error) : null}
      onOpen={() => open.mutate(chest)}
      onDone={() => router.replace({ pathname: '/child/home', params: { id } })}
    />
  );
}
