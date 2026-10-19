import {
  cosmeticsOf,
  missingUnlock,
  type Avatar,
  type CosmeticId,
  type CosmeticSlot,
  type Unlocked,
} from '@math-genius/shared';
import { Pressable, ThemedText, View, cx } from '@math-genius/ui';
import { useState, type ReactNode } from 'react';

import { COSMETIC_ART } from '@/components/hero/cosmetic-art';
import { HeroBust } from '@/components/hero/hero-bust';
import { strings } from '@/i18n';
import { cosmeticName } from '@/i18n/cosmetic-names';

const t = strings.look;

/** The slots the catalog has cosmetics for, in the editor's order. */
const SLOTS = (['aura', 'frame', 'companion', 'accessory'] as const).filter(
  (slot) => cosmeticsOf(slot).length > 0,
);

type CosmeticPickerProps = {
  avatar: Avatar;
  unlocked: Unlocked;
  onPick: (slot: CosmeticSlot, id: CosmeticId | null) => void;
};

/** One slot at a time (tabs), its cosmetics below: what is not unlocked yet shows a lock. */
export function CosmeticPicker({ avatar, unlocked, onPick }: CosmeticPickerProps) {
  const [slot, setSlot] = useState<CosmeticSlot>('aura');
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2" accessibilityRole="tablist">
        {SLOTS.map((name) => (
          <Pressable
            key={name}
            accessibilityRole="tab"
            aria-selected={name === slot}
            onPress={() => setSlot(name)}
            className={cx(
              'rounded-full border px-4 py-2 active:opacity-80',
              name === slot ? 'border-primary bg-primary' : 'border-border bg-surface',
            )}
          >
            <ThemedText tone={name === slot ? 'onPrimary' : 'default'}>{t.slots[name]}</ThemedText>
          </Pressable>
        ))}
      </View>
      <View className="flex-row flex-wrap justify-center gap-2" accessibilityRole="radiogroup">
        <Chip
          label={t.noneLabel(t.slots[slot])}
          chosen={avatar.wear[slot] === undefined}
          locked={false}
          onPress={() => onPick(slot, null)}
        >
          <ThemedText variant="caption">{t.none}</ThemedText>
        </Chip>
        {cosmeticsOf(slot).map((cosmetic) => {
          const locked = missingUnlock(cosmetic, unlocked) !== null;
          const name = cosmeticName(cosmetic.id);
          const art = cosmetic.visual.kind === 'overlay' ? COSMETIC_ART[cosmetic.visual.art] : null;
          return (
            <Chip
              key={cosmetic.id}
              label={locked ? t.lockedLabel(name) : name}
              chosen={avatar.wear[slot] === cosmetic.id}
              locked={locked}
              onPress={() => onPick(slot, cosmetic.id)}
            >
              {art?.kind === 'emoji' ? (
                <ThemedText variant="title">{art.char}</ThemedText>
              ) : (
                // Auras and frames are seen on the hero.
                <HeroBust avatar={{ hero: avatar.hero, wear: { [slot]: cosmetic.id } }} size="sm" />
              )}
            </Chip>
          );
        })}
      </View>
    </View>
  );
}

type ChipProps = {
  label: string;
  chosen: boolean;
  locked: boolean;
  onPress: () => void;
  children: ReactNode;
};

function Chip({ label, chosen, locked, onPress, children }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={chosen}
      accessibilityLabel={label}
      onPress={onPress}
      className={cx(
        'size-20 items-center justify-center rounded-lg border-2 bg-surface active:opacity-80',
        chosen ? 'border-primary' : 'border-border',
      )}
    >
      {children}
      {locked ? (
        <View className="absolute -right-1 -top-1 rounded-full border border-border bg-background px-1">
          <ThemedText variant="caption">{t.lock}</ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}
