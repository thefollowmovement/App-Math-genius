import {
  OUTFITS,
  cosmeticOf,
  isOutfitId,
  missingUnlock,
  type CosmeticId,
  type HeroId,
  type OutfitId,
  type Unlocked,
} from '@math-genius/shared';
import { Pressable, ThemedText, View, cx } from '@math-genius/ui';

import { Icon } from '@/components/game/icons';
import { HeroPicture } from '@/components/hero/hero-view';
import { strings } from '@/i18n';
import { lockedText } from '@/i18n/cosmetic-names';

const t = strings.outfits;

type OutfitPickerProps = {
  hero: HeroId;
  /** The outfit worn in the look being chosen (undefined: the stage outfit). */
  worn: CosmeticId | undefined;
  /** The outfit the hero wears as saved (null: its stage outfit). */
  saved: OutfitId | null;
  unlocked: Unlocked;
  /** A cosmetic just tried before it was unlocked: an outfit shows on the hero all the same. */
  tried: CosmeticId | null;
  onPick: (id: CosmeticId | null) => void;
};

/**
 * The hero's outfits: the one chosen, or just tried, on the hero in full before it is saved, then
 * a card each (the stage outfit first), a lock on those not unlocked yet.
 */
export function OutfitPicker({ hero, worn, saved, unlocked, tried, onPick }: OutfitPickerProps) {
  const chosen = worn !== undefined && isOutfitId(worn) ? worn : null;
  const triedOutfit = tried !== null && isOutfitId(tried) ? tried : undefined;
  const shown = triedOutfit ?? chosen;
  const cosmetic = triedOutfit ? cosmeticOf(triedOutfit) : undefined;
  const missing = cosmetic ? missingUnlock(cosmetic, unlocked) : null;
  const { name, worn: wornText, description } = shown ? t.items[shown] : t.stage;
  return (
    <View className="gap-3">
      <View accessibilityLiveRegion="polite" className="flex-row items-end gap-3">
        <View className="h-48 w-32">
          <HeroPicture
            look={{ hero, outfit: shown }}
            pose="victory"
            label={t.previewLabel(strings.heroes.items[hero].name, wornText)}
          />
        </View>
        <View className="flex-1 gap-1 pb-2">
          <ThemedText variant="label" tone="secondary">
            {t.preview}
          </ThemedText>
          <ThemedText variant="headline">{name}</ThemedText>
          <ThemedText variant="caption">{description}</ThemedText>
          <ThemedText variant="caption" tone={missing ? 'accent' : 'default'}>
            {triedOutfit && missing
              ? lockedText(triedOutfit, missing)
              : shown === saved
                ? t.worn
                : t.toSave}
          </ThemedText>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-2">
        <OutfitCard
          hero={hero}
          outfit={null}
          label={t.stage.name}
          name={t.stage.short}
          chosen={chosen === null}
          locked={false}
          onPress={() => onPick(null)}
        />
        {OUTFITS.map(({ id }) => {
          const item = cosmeticOf(id);
          const locked = !item || missingUnlock(item, unlocked) !== null;
          const { name, short } = t.items[id];
          return (
            <OutfitCard
              key={id}
              hero={hero}
              outfit={id}
              label={locked ? strings.look.lockedLabel(name) : name}
              name={short}
              chosen={chosen === id}
              locked={locked}
              onPress={() => onPick(id)}
            />
          );
        })}
      </View>
    </View>
  );
}

type OutfitCardProps = {
  hero: HeroId;
  outfit: OutfitId | null;
  /** Spoken label: the outfit's full name. */
  label: string;
  /** Its short name, beside the bust. */
  name: string;
  chosen: boolean;
  locked: boolean;
  onPress: () => void;
};

/** An outfit on the child's own hero, as a bust. */
function OutfitCard({ hero, outfit, label, name, chosen, locked, onPress }: OutfitCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={chosen}
      accessibilityLabel={label}
      onPress={onPress}
      className={cx(
        'grow basis-[45%] flex-row items-center gap-3 rounded-lg border-3 p-2 active:opacity-80',
        chosen
          ? 'border-primary bg-surface bg-linear-to-b from-primary/25 to-surface glow-primary'
          : 'border-border bg-surface',
      )}
    >
      <View>
        <View
          className={cx('size-14 overflow-hidden rounded-md bg-background', locked && 'opacity-60')}
        >
          <HeroPicture look={{ hero, outfit }} pose="bust" />
        </View>
        {/* On the bust's corner, clear of the name. */}
        {chosen ? (
          <View className="absolute -right-2 -top-2 size-6 items-center justify-center rounded-full bg-primary">
            <Icon name="check" color="onPrimary" size="sm" />
          </View>
        ) : locked ? (
          <View className="absolute -right-2 -top-2 size-6 items-center justify-center rounded-full border-2 border-border bg-surface">
            <Icon name="lock" color="muted" size="sm" />
          </View>
        ) : null}
      </View>
      <ThemedText variant="caption" tone="default" numberOfLines={2} className="flex-1">
        {name}
      </ThemedText>
    </Pressable>
  );
}
