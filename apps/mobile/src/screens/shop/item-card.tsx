import { heroLook, type ShopItem } from '@math-genius/shared';
import { Button, ThemedText, View, cx } from '@math-genius/ui';

import { useChildHero } from '@/components/hero/hero-context';
import { HeroPicture } from '@/components/hero/hero-view';
import type { ItemView } from '@/data/rewards-model';
import { strings } from '@/i18n';
import { shopItemName } from '@/i18n/cosmetic-names';

const t = strings.shop;

type ItemCardProps = {
  /** Companions have cards of their own (CompanionShelf). */
  item: ItemView<Exclude<ShopItem, { kind: 'companion' }>>;
  gems: number;
  pending: boolean;
  onBuy: () => void;
  onWear: (wear: boolean) => void;
};

/**
 * An item of the shop: its price, or whether the child wears it. An outfit shows on the child's
 * own hero.
 */
export function ItemCard({ item, gems, pending, onBuy, onWear }: ItemCardProps) {
  const name = shopItemName(item.code);
  const missing = item.price - gems;
  return (
    <View
      className={cx(
        'flex-row items-center gap-4 rounded-lg border bg-surface p-4',
        item.worn ? 'border-primary' : 'border-border',
      )}
    >
      {item.kind === 'outfit' ? (
        <OutfitBust outfit={item.code} />
      ) : (
        <ThemedText variant="title">{t.items[item.code].icon}</ThemedText>
      )}
      <View className="flex-1 gap-1">
        <ThemedText variant="headline">{name}</ThemedText>
        <ThemedText variant="caption">
          {item.worn ? t.worn : item.owned ? '' : t.price(item.price)}
        </ThemedText>
      </View>
      {item.owned ? (
        <Button
          variant={item.worn ? 'ghost' : 'secondary'}
          title={item.worn ? t.takeOff : t.wear}
          accessibilityLabel={item.worn ? t.takeOffLabel(name) : t.wearLabel(name)}
          loading={pending}
          onPress={() => onWear(!item.worn)}
        />
      ) : missing > 0 ? (
        <ThemedText variant="caption">{t.missing(missing)}</ThemedText>
      ) : (
        <Button
          title={t.buy}
          accessibilityLabel={t.buyLabel(name, item.price)}
          loading={pending}
          onPress={onBuy}
        />
      )}
    </View>
  );
}

/** The child's hero in an outfit of the shop. */
function OutfitBust({ outfit }: { outfit: Extract<ShopItem, { kind: 'outfit' }>['code'] }) {
  const { hero } = heroLook(useChildHero());
  return (
    <View className="size-14 overflow-hidden rounded-md border-2 border-border bg-background">
      <HeroPicture look={{ hero, outfit }} pose="bust" />
    </View>
  );
}
