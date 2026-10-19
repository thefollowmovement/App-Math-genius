import { useLocalSearchParams } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { errorKind } from '@/data/errors';
import { lookOf } from '@/data/look-model';
import { useBuyFreeze, useBuyItem, useRewards, useWearItem } from '@/data/rewards';
import { shopGroups } from '@/data/rewards-model';
import { Shop } from '@/screens/shop';

export default function ShopRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const rewards = useRewards(id);
  const buy = useBuyItem(id);
  const wear = useWearItem(id);
  const freeze = useBuyFreeze(id);

  if (!rewards.data || !child.data) return <LoadingScreen />;
  const failed = buy.error ?? wear.error ?? freeze.error;

  return (
    <Shop
      gems={rewards.data.progress.gems}
      freezes={rewards.data.progress.freezes}
      groups={shopGroups(rewards.data.items, lookOf(child.data).avatar.wear)}
      pending={
        freeze.isPending
          ? 'freeze'
          : buy.isPending
            ? (buy.variables ?? null)
            : wear.isPending
              ? (wear.variables?.code ?? null)
              : null
      }
      error={failed ? errorKind(failed) : null}
      onBuyFreeze={() => freeze.mutate()}
      onBuy={(code) => buy.mutate(code)}
      onWear={(code, worn) => wear.mutate({ code, wear: worn })}
    />
  );
}
