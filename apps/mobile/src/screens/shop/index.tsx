import { FREEZE_PRICE, MAX_FREEZES, type ShopItemCode } from '@math-genius/shared';
import { Button, Screen, ThemedText, View } from '@math-genius/ui';

import type { ErrorKind } from '@/data/errors';
import type { ShopGroup } from '@/data/rewards-model';
import { strings } from '@/i18n';

import { ItemCard } from './item-card';

const t = strings.shop;

type ShopProps = {
  gems: number;
  freezes: number;
  groups: ShopGroup[];
  /** The item being bought or worn, or 'freeze'. */
  pending: ShopItemCode | 'freeze' | null;
  error: ErrorKind | null;
  onBuyFreeze: () => void;
  onBuy: (code: ShopItemCode) => void;
  onWear: (code: ShopItemCode, wear: boolean) => void;
};

/** Gems buy streak freezes, companions, accessories and victory effects; never real money. */
export function Shop({
  gems,
  freezes,
  groups,
  pending,
  error,
  onBuyFreeze,
  onBuy,
  onWear,
}: ShopProps) {
  return (
    <Screen>
      <View className="gap-1">
        <ThemedText variant="title">{t.title}</ThemedText>
        <ThemedText variant="headline">{`${strings.rewards.gem} ${t.balance(gems)}`}</ThemedText>
        <ThemedText variant="caption">{t.intro}</ThemedText>
      </View>
      {error ? (
        <ThemedText tone="danger" accessibilityLiveRegion="polite">
          {strings.errors[error]}
        </ThemedText>
      ) : null}
      <View className="gap-3 rounded-lg border border-border bg-surface p-4">
        <ThemedText variant="headline" accessibilityRole="header">
          {`${t.freezes.icon} ${t.freezes.title} · ${t.freezes.count(freezes, MAX_FREEZES)}`}
        </ThemedText>
        <ThemedText variant="caption">{t.freezes.hint}</ThemedText>
        {freezes >= MAX_FREEZES ? (
          <ThemedText variant="caption">{t.freezes.full}</ThemedText>
        ) : gems < FREEZE_PRICE ? (
          <ThemedText variant="caption">{t.missing(FREEZE_PRICE - gems)}</ThemedText>
        ) : (
          <Button
            variant="secondary"
            title={t.freezes.buy(FREEZE_PRICE)}
            loading={pending === 'freeze'}
            onPress={onBuyFreeze}
          />
        )}
      </View>
      {groups.map((group) => (
        <View key={group.kind} className="gap-3">
          <View className="gap-1">
            <ThemedText variant="headline" accessibilityRole="header">
              {t.kinds[group.kind]}
            </ThemedText>
            <ThemedText variant="caption">{t.kindHints[group.kind]}</ThemedText>
          </View>
          {group.items.map((item) => (
            <ItemCard
              key={item.code}
              item={item}
              gems={gems}
              pending={pending === item.code}
              onBuy={() => onBuy(item.code)}
              onWear={(wear) => onWear(item.code, wear)}
            />
          ))}
        </View>
      ))}
    </Screen>
  );
}
