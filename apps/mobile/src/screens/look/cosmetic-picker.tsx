import {
  cosmeticsOf,
  missingUnlock,
  type Avatar,
  type CosmeticId,
  type CosmeticSlot,
  type Unlocked,
} from '@math-genius/shared';
import { Pressable, ThemedText, View, cx } from '@math-genius/ui';
import { useId, type ReactNode } from 'react';

import { Icon } from '@/components/game/icons';
import {
  AuraDrawing,
  COSMETIC_ART,
  FrameDrawing,
  type OverlayArt,
} from '@/components/hero/cosmetic-art';
import { strings } from '@/i18n';
import { cosmeticName } from '@/i18n/cosmetic-names';

import { CompanionPicker } from './companion-picker';

const t = strings.look;

/** The slots the catalog has cosmetics for, in the editor's order. */
const SLOTS = (['aura', 'frame', 'companion', 'accessory'] as const).filter(
  (slot) => cosmeticsOf(slot).length > 0,
);

type CosmeticPickerProps = {
  avatar: Avatar;
  unlocked: Unlocked;
  /** The cosmetic just tried before it was unlocked. */
  tried: CosmeticId | null;
  onPick: (slot: CosmeticSlot, id: CosmeticId | null) => void;
};

/**
 * What surrounds the hero, a card per slot (docs/design/maquettes/Avatars.html): each cosmetic as
 * a small drawing, a lock on what is not unlocked yet; companions on cards of their own.
 */
export function CosmeticPicker({ avatar, unlocked, tried, onPick }: CosmeticPickerProps) {
  return (
    <View className="gap-3">
      {SLOTS.map((slot) => (
        <View
          key={slot}
          accessibilityRole="radiogroup"
          accessibilityLabel={t.slots[slot]}
          className="gap-3 rounded-lg border-2 border-border bg-surface p-3"
        >
          <ThemedText variant="label">{t.slots[slot]}</ThemedText>
          {slot === 'companion' ? (
            <CompanionPicker
              worn={avatar.wear.companion}
              unlocked={unlocked}
              tried={tried}
              onPick={(id) => onPick(slot, id)}
            />
          ) : (
            <View className="flex-row flex-wrap gap-2">
              <Swatch
                label={t.noneLabel(t.slots[slot])}
                chosen={avatar.wear[slot] === undefined}
                locked={false}
                round={slot === 'aura'}
                onPress={() => onPick(slot, null)}
              >
                <Icon name="close" color="muted" size="sm" />
              </Swatch>
              {cosmeticsOf(slot).map((cosmetic) => {
                const locked = missingUnlock(cosmetic, unlocked) !== null;
                const name = cosmeticName(cosmetic.id);
                const art =
                  cosmetic.visual.kind === 'overlay'
                    ? COSMETIC_ART[cosmetic.visual.art]
                    : undefined;
                return (
                  <Swatch
                    key={cosmetic.id}
                    label={locked ? t.lockedLabel(name) : name}
                    chosen={avatar.wear[slot] === cosmetic.id}
                    locked={locked}
                    round={slot === 'aura'}
                    onPress={() => onPick(slot, cosmetic.id)}
                  >
                    {art ? <SwatchArt art={art} /> : null}
                  </Swatch>
                );
              })}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

/** A cosmetic alone, small: a glow, a frame, a sticker. */
function SwatchArt({ art }: { art: OverlayArt }) {
  const id = `swatch${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (art.kind === 'emoji') return <ThemedText variant="headline">{art.char}</ThemedText>;
  return (
    <View className="size-full">
      {art.kind === 'aura' ? (
        <AuraDrawing colors={art.colors} id={id} />
      ) : (
        <FrameDrawing draw={art.draw} />
      )}
    </View>
  );
}

type SwatchProps = {
  label: string;
  chosen: boolean;
  locked: boolean;
  round: boolean;
  onPress: () => void;
  children: ReactNode;
};

function Swatch({ label, chosen, locked, round, onPress, children }: SwatchProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={chosen}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={2}
      className={cx(
        'size-12 items-center justify-center border-3 bg-background p-1 active:opacity-80',
        round ? 'rounded-full' : 'rounded-md',
        chosen ? 'border-foreground' : 'border-border',
      )}
    >
      <View className={cx('size-full items-center justify-center', locked && 'opacity-40')}>
        {children}
      </View>
      {locked ? (
        <View className="absolute -right-2 -top-2 size-6 items-center justify-center rounded-full border-2 border-border bg-surface">
          <Icon name="lock" color="muted" size="sm" />
        </View>
      ) : null}
    </Pressable>
  );
}
