import {
  COMPANIONS,
  cosmeticOf,
  isCompanionId,
  missingUnlock,
  type CosmeticId,
  type Unlocked,
} from '@math-genius/shared';
import { Pressable, ThemedText, View, cx } from '@math-genius/ui';

import { CompanionCard } from '@/components/companion/companion-card';
import { CompanionDetails } from '@/components/companion/companion-details';
import { Icon } from '@/components/game/icons';
import { strings } from '@/i18n';

const t = strings.look;

type CompanionPickerProps = {
  /** The companion worn in the look being chosen. */
  worn: CosmeticId | undefined;
  unlocked: Unlocked;
  /** A cosmetic just tried before it was unlocked: a companion's sheet shows then. */
  tried: CosmeticId | null;
  onPick: (id: CosmeticId | null) => void;
};

/**
 * The companions on cards, three by three (short name, rarity, a lock until unlocked), and the
 * sheet of the one chosen, or just tried.
 */
export function CompanionPicker({ worn, unlocked, tried, onPick }: CompanionPickerProps) {
  const shown =
    tried !== null && isCompanionId(tried)
      ? tried
      : worn !== undefined && isCompanionId(worn)
        ? worn
        : null;
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          accessibilityRole="radio"
          aria-checked={worn === undefined}
          accessibilityLabel={t.noneLabel(t.slots.companion)}
          onPress={() => onPick(null)}
          className={cx(
            'grow basis-[30%] items-center justify-center gap-1 rounded-lg border-3 bg-surface p-1.5 active:opacity-80',
            worn === undefined ? 'border-primary' : 'border-border',
          )}
        >
          <View className="size-16 items-center justify-center">
            <Icon name="close" color="muted" />
          </View>
          <ThemedText variant="caption" tone="default">
            {t.none}
          </ThemedText>
        </Pressable>
        {COMPANIONS.map(({ id }) => {
          const cosmetic = cosmeticOf(id);
          const locked = !cosmetic || missingUnlock(cosmetic, unlocked) !== null;
          const { name } = strings.companions.items[id];
          return (
            <CompanionCard
              key={id}
              companion={id}
              chosen={worn === id}
              locked={locked}
              label={locked ? t.lockedLabel(name) : undefined}
              onPress={() => onPick(id)}
              className="basis-[30%]"
            />
          );
        })}
      </View>
      {shown ? <CompanionDetails companion={shown} /> : null}
    </View>
  );
}
