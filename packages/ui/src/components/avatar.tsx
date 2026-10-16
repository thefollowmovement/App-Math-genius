import { cx } from '../class-names';
import { View } from '../primitives';
import { ThemedText } from './themed-text';

const sizeClassNames = {
  md: { circle: 'size-14', variant: 'headline' },
  lg: { circle: 'size-24', variant: 'display' },
} as const;

type AvatarProps = {
  name: string;
  size?: keyof typeof sizeClassNames;
  className?: string;
};

/** Placeholder avatar: the name's initial in a circle, until avatars arrive with the themes. */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const { circle, variant } = sizeClassNames[size];
  return (
    <View
      accessible={false}
      className={cx('items-center justify-center rounded-full bg-primary', circle, className)}
    >
      <ThemedText variant={variant} tone="onPrimary">
        {name.trim().charAt(0).toUpperCase()}
      </ThemedText>
    </View>
  );
}
