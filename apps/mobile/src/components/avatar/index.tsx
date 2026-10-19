import type { AccessoryCode, Avatar } from '@math-genius/shared';
import { View, cx } from '@math-genius/ui';
import Svg, { Circle, Rect } from 'react-native-svg';

import { HAIR, OUTFIT, SKIN } from './palette';
import { ACCESSORIES, EYES, HAIRS, OUTFITS, Smile } from './parts';

const SIZES = { sm: 'size-14', md: 'size-20', lg: 'size-24', xl: 'size-40' } as const;

type AvatarPictureProps = {
  avatar: Avatar;
  /** The accessory worn (shop). */
  accessory?: AccessoryCode;
  size?: keyof typeof SIZES;
  /** Spoken label; without one the picture is decorative. */
  label?: string;
  /** Layout only. */
  className?: string;
};

/** The child's avatar, drawn from its parts on a disc of the theme's primary color. */
export function AvatarPicture({
  avatar,
  accessory,
  size = 'md',
  label,
  className,
}: AvatarPictureProps) {
  const skin = SKIN[avatar.skin];
  const hair = HAIRS[avatar.hair];
  const hairColor = HAIR[avatar.hairColor];
  const Accessory = accessory ? ACCESSORIES[accessory] : null;
  const Eyes = EYES[avatar.eyes];
  return (
    <View
      accessible={label !== undefined}
      accessibilityRole={label === undefined ? undefined : 'image'}
      accessibilityLabel={label}
      importantForAccessibility={label === undefined ? 'no-hide-descendants' : 'yes'}
      className={cx('overflow-hidden rounded-full bg-primary', SIZES[size], className)}
    >
      <Svg width="100%" height="100%" viewBox="0 0 120 120">
        {OUTFITS[avatar.outfit](OUTFIT[avatar.outfitColor])}
        {hair.back?.(hairColor)}
        <Rect x={53} y={70} width={14} height={20} rx={6} fill={skin} />
        <Circle cx={36} cy={57} r={5} fill={skin} />
        <Circle cx={84} cy={57} r={5} fill={skin} />
        <Circle cx={60} cy={54} r={24} fill={skin} />
        <Eyes />
        <Smile />
        {hair.front?.(hairColor)}
        {Accessory ? <Accessory /> : null}
      </Svg>
    </View>
  );
}
