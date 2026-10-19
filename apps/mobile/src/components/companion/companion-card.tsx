import { companionOf, companionStage, type CompanionId } from '@math-genius/shared';
import { Pressable, ThemedText, View, cx } from '@math-genius/ui';

import { Icon } from '@/components/game/icons';
import { strings } from '@/i18n';

import { CompanionPicture } from './companion-picture';
import { RarityTag } from './rarity-tag';

type CompanionCardProps = {
  companion: CompanionId;
  chosen: boolean;
  /** Not unlocked yet: dimmed, with a lock. */
  locked?: boolean;
  /** Under the rarity: a price, « Porté »… */
  detail?: string;
  /** Spoken label (the name and rarity by default). */
  label?: string;
  onPress: () => void;
  /** Layout only (its share of the row). */
  className?: string;
};

/** A companion on a card: its picture, short name and rarity (the sheet tells the rest). */
export function CompanionCard({
  companion,
  chosen,
  locked = false,
  detail,
  label,
  onPress,
  className,
}: CompanionCardProps) {
  const { name } = strings.companions.items[companion];
  const rarity = companionOf(companion)?.rarity ?? 'common';
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={chosen}
      accessibilityLabel={
        label ?? strings.companions.cardLabel(name, strings.companions.rarities[rarity])
      }
      onPress={onPress}
      className={cx(
        'grow items-center gap-1 rounded-lg border-3 p-1.5 pb-2 active:opacity-80',
        chosen
          ? 'border-primary bg-surface bg-linear-to-b from-primary/25 to-surface glow-primary'
          : 'border-border bg-surface',
        className,
      )}
    >
      <View className={cx('size-16', locked && 'opacity-40')}>
        <CompanionPicture companion={{ id: companion, stage: companionStage(companion) }} />
      </View>
      <ThemedText variant="caption" tone="default" numberOfLines={2} className="text-center">
        {name}
      </ThemedText>
      <RarityTag rarity={rarity} />
      {detail ? <ThemedText variant="caption">{detail}</ThemedText> : null}
      {chosen ? (
        <View className="absolute right-1.5 top-1.5 size-6 items-center justify-center rounded-full bg-primary">
          <Icon name="check" color="onPrimary" size="sm" />
        </View>
      ) : locked ? (
        <View className="absolute right-1.5 top-1.5 size-6 items-center justify-center rounded-full border-2 border-border bg-surface">
          <Icon name="lock" color="muted" size="sm" />
        </View>
      ) : null}
    </Pressable>
  );
}
