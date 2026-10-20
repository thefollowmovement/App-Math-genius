import type { HeroId, HeroLook, HeroPose } from '@math-genius/shared';
import { View, cx } from '@math-genius/ui';
import { Image } from 'expo-image';

import { HERO_ART, heroPicture } from './hero-art';

// Poses are portraits (2 × 3), the bust is square.
const POSE_SIZES = { sm: 'h-28 w-20', md: 'h-40 w-28', lg: 'h-60 w-40' } as const;

type HeroViewProps = {
  /** The hero and the outfit it wears. */
  look: HeroLook;
  pose: Exclude<HeroPose, 'bust'>;
  size?: keyof typeof POSE_SIZES;
  /** Spoken label; without one the picture is decorative. */
  label?: string;
  /** Layout only. */
  className?: string;
};

/** A hero in a pose (victory, encouragement, thinking), with its transparent background. */
export function HeroView({ look, pose, size = 'md', label, className }: HeroViewProps) {
  return (
    <View className={cx(POSE_SIZES[size], className)}>
      <HeroPicture look={look} pose={pose} label={label} />
    </View>
  );
}

/** The hero on stage in its stage outfit (a hero card), filling its box, cropped from the top. */
export function HeroOnStage({ hero }: { hero: HeroId }) {
  return (
    <Image
      source={HERO_ART[hero].card}
      contentFit="cover"
      contentPosition="top"
      style={{ width: '100%', height: '100%' }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/** The picture itself, filling its box, in the outfit the hero wears. */
export function HeroPicture({
  look,
  pose,
  label,
}: {
  look: HeroLook;
  pose: HeroPose;
  label?: string;
}) {
  return (
    <Image
      source={heroPicture(look, pose)}
      contentFit="contain"
      style={{ width: '100%', height: '100%' }}
      accessible={label !== undefined}
      accessibilityLabel={label}
      accessibilityRole={label === undefined ? undefined : 'image'}
      importantForAccessibility={label === undefined ? 'no-hide-descendants' : 'yes'}
    />
  );
}
