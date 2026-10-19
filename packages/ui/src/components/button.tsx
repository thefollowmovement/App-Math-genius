import { cx } from '../class-names';
import { Pressable } from '../primitives';
import { ThemedText } from './themed-text';

const variantClassNames = {
  primary: { container: 'bg-primary', label: 'text-on-primary' },
  secondary: { container: 'bg-secondary', label: 'text-on-secondary' },
} as const;

const sizeClassNames = {
  md: 'px-5 py-3',
  lg: 'px-6 py-5',
} as const;

export type ButtonVariant = keyof typeof variantClassNames;
export type ButtonSize = keyof typeof sizeClassNames;

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Layout only (width, margins). */
  className?: string;
  testID?: string;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  testID,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      className={cx(
        'items-center justify-center rounded-lg active:opacity-80',
        variantClassNames[variant].container,
        sizeClassNames[size],
        disabled && 'opacity-40',
        className,
      )}
    >
      <ThemedText variant="headline" className={variantClassNames[variant].label}>
        {title}
      </ThemedText>
    </Pressable>
  );
}
