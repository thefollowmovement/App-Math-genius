import type { ShopItem } from '@math-genius/shared';
import { Button, ThemedText, View } from '@math-genius/ui';
import { useState } from 'react';

import { CompanionCard } from '@/components/companion/companion-card';
import { CompanionDetails } from '@/components/companion/companion-details';
import type { ItemView } from '@/data/rewards-model';
import { strings } from '@/i18n';

const t = strings.shop;

type Companion = ItemView<Extract<ShopItem, { kind: 'companion' }>>;

type CompanionShelfProps = {
  items: Companion[];
  gems: number;
  /** The companion being bought or worn. */
  pending: Companion['code'] | null;
  onBuy: (code: Companion['code']) => void;
  onWear: (code: Companion['code'], wear: boolean) => void;
};

/**
 * The companions for sale, two by two (short name, rarity, price), and the sheet of the one
 * picked, with what the child can do: buy it, wear it or take it off.
 */
export function CompanionShelf({ items, gems, pending, onBuy, onWear }: CompanionShelfProps) {
  const [picked, setPicked] = useState(
    () => items.find((item) => item.worn)?.code ?? items[0]?.code,
  );
  const item = items.find((candidate) => candidate.code === picked);
  return (
    <View className="gap-3">
      <View
        className="flex-row flex-wrap gap-3"
        accessibilityRole="radiogroup"
        accessibilityLabel={t.kinds.companion}
      >
        {items.map((candidate) => (
          <CompanionCard
            key={candidate.code}
            companion={candidate.code}
            chosen={candidate.code === picked}
            detail={candidate.worn ? t.worn : candidate.owned ? t.owned : t.price(candidate.price)}
            onPress={() => setPicked(candidate.code)}
            className="basis-[45%]"
          />
        ))}
      </View>
      {item ? (
        <CompanionDetails companion={item.code}>
          <ItemAction
            item={item}
            gems={gems}
            pending={pending === item.code}
            {...{ onBuy, onWear }}
          />
        </CompanionDetails>
      ) : null}
    </View>
  );
}

type ItemActionProps = Pick<CompanionShelfProps, 'gems' | 'onBuy' | 'onWear'> & {
  item: Companion;
  pending: boolean;
};

function ItemAction({ item, gems, pending, onBuy, onWear }: ItemActionProps) {
  const { name } = strings.companions.items[item.code];
  const missing = item.price - gems;
  if (item.owned) {
    return (
      <Button
        variant={item.worn ? 'outline' : 'secondary'}
        title={item.worn ? t.takeOff : t.wear}
        accessibilityLabel={item.worn ? t.takeOffLabel(name) : t.wearLabel(name)}
        loading={pending}
        onPress={() => onWear(item.code, !item.worn)}
      />
    );
  }
  if (missing > 0) {
    return (
      <ThemedText variant="caption" className="text-center">
        {`${t.price(item.price)} · ${t.missing(missing)}`}
      </ThemedText>
    );
  }
  return (
    <Button
      title={`${t.buy} · ${t.price(item.price)}`}
      accessibilityLabel={t.buyLabel(name, item.price)}
      loading={pending}
      onPress={() => onBuy(item.code)}
    />
  );
}
