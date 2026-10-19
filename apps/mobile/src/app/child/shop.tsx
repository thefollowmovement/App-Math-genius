import { useLocalSearchParams } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { errorKind } from '@/data/errors';
import { useBuyFreeze, useBuyItem, useRewards, useWearItem } from '@/data/rewards';
import { shopGroups } from '@/data/rewards-model';
import { Shop } from '@/screens/shop';

export default function ShopRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rewards = useRewards(id);
  const buy = useBuyItem(id);
  const wear = useWearItem(id);
  const freeze = useBuyFreeze(id);

  if (!rewards.data) return <LoadingScreen />;
  const failed = buy.error ?? wear.error ?? freeze.error;

  return (
    <Shop
      gems={rewards.data.progress.gems}
      freezes={rewards.data.progress.freezes}
      groups={shopGroups(rewards.data.items)}
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
