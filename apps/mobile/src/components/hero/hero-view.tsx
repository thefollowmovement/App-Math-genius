import type { HeroId, HeroPose } from '@math-genius/shared';
import { View, cx } from '@math-genius/ui';
import { Image } from 'expo-image';

import { HERO_ART } from './hero-art';

// Poses are portraits (2 × 3), the bust is square.
const POSE_SIZES = { sm: 'h-24 w-16', md: 'h-40 w-28', lg: 'h-60 w-40' } as const;

type HeroViewProps = {
  hero: HeroId;
  pose: Exclude<HeroPose, 'bust'>;
  size?: keyof typeof POSE_SIZES;
  /** Spoken label; without one the picture is decorative. */
  label?: string;
  /** Layout only. */
  className?: string;
};

/** A hero in a pose (victory, encouragement, thinking), with its transparent background. */
export function HeroView({ hero, pose, size = 'md', label, className }: HeroViewProps) {
  return (
    <View className={cx(POSE_SIZES[size], className)}>
      <HeroPicture hero={hero} pose={pose} label={label} />
    </View>
  );
}

/** The picture itself, filling its box. The only place that knows how heroes are drawn. */
export function HeroPicture({
  hero,
  pose,
  label,
}: {
  hero: HeroId;
  pose: HeroPose;
  label?: string;
}) {
  const art = HERO_ART[hero];
  return (
    <Image
      source={art.poses[pose]}
      contentFit="contain"
      style={{ width: '100%', height: '100%' }}
      accessible={label !== undefined}
      accessibilityLabel={label}
      accessibilityRole={label === undefined ? undefined : 'image'}
      importantForAccessibility={label === undefined ? 'no-hide-descendants' : 'yes'}
    />
  );
}
