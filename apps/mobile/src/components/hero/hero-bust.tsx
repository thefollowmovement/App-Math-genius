import { companionLook, cosmeticOf, type Avatar, type CosmeticSlot } from '@math-genius/shared';
import { ThemedText, View, cx } from '@math-genius/ui';
import { useId } from 'react';

import { CompanionPicture } from '../companion/companion-picture';
import { AuraDrawing, COSMETIC_ART, FrameDrawing, type OverlayArt } from './cosmetic-art';
import { HeroPicture } from './hero-view';

const SIZES = {
  sm: { box: 'size-14', sticker: 'caption' },
  md: { box: 'size-20', sticker: 'body' },
  lg: { box: 'size-24', sticker: 'headline' },
  xl: { box: 'size-40', sticker: 'title' },
} as const;

type HeroBustProps = {
  avatar: Avatar;
  size?: keyof typeof SIZES;
  /** Spoken label; without one the portrait is decorative. */
  label?: string;
  /** Layout only. */
  className?: string;
};

/** The drawing of the cosmetic worn in a slot, if it is drawn around the hero. */
function overlay(avatar: Avatar, slot: CosmeticSlot): OverlayArt | undefined {
  const id = avatar.wear[slot];
  const visual = id ? cosmeticOf(id)?.visual : undefined;
  // Layers belong to animated heroes (Rive): a still picture cannot show them.
  return visual?.kind === 'overlay' ? COSMETIC_ART[visual.art] : undefined;
}

/**
 * The child's hero as a portrait, with what it wears around it: an aura behind, a frame, an
 * accessory sticker and its companion beside it, floating (except on the smallest portraits).
 * The hero's drawing itself never changes.
 */
export function HeroBust({ avatar, size = 'lg', label, className }: HeroBustProps) {
  const gradientId = `aura${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { box, sticker } = SIZES[size];
  const aura = overlay(avatar, 'aura');
  const frame = overlay(avatar, 'frame');
  const accessory = overlay(avatar, 'accessory');
  const companion = companionLook(avatar);
  return (
    <View
      accessible={label !== undefined}
      accessibilityRole={label === undefined ? undefined : 'image'}
      accessibilityLabel={label}
      importantForAccessibility={label === undefined ? 'no-hide-descendants' : 'yes'}
      className={cx(box, className)}
    >
      {aura?.kind === 'aura' ? (
        <View className="absolute -inset-[20%]">
          <AuraDrawing colors={aura.colors} id={gradientId} />
        </View>
      ) : null}
      <View className="size-full overflow-hidden rounded-full border border-border bg-surface">
        <HeroPicture hero={avatar.hero} pose="bust" />
      </View>
      {frame?.kind === 'frame' ? (
        <View className="absolute -inset-[15%]">
          <FrameDrawing draw={frame.draw} />
        </View>
      ) : null}
      {accessory?.kind === 'emoji' ? (
        <ThemedText variant={sticker} className="absolute -right-[8%] -top-[8%]">
          {accessory.char}
        </ThemedText>
      ) : null}
      {companion ? (
        <View className="absolute -bottom-[8%] -right-[22%] size-[55%]">
          <CompanionPicture companion={companion} float={size !== 'sm'} />
        </View>
      ) : null}
    </View>
  );
}
