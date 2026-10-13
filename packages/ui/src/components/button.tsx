import { cx } from '../class-names';
import { ActivityIndicator, Pressable } from '../primitives';
import { ThemedText } from './themed-text';

const variantClassNames = {
  primary: { container: 'bg-primary', label: 'text-on-primary' },
  secondary: { container: 'bg-secondary', label: 'text-on-secondary' },
  ghost: { container: 'bg-transparent', label: 'text-foreground' },
  danger: { container: 'bg-transparent border border-danger', label: 'text-danger' },
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
  /** Shows a spinner and ignores presses, e.g. while a request runs. */
  loading?: boolean;
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
  loading = false,
  className,
  testID,
}: ButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      testID={testID}
      className={cx(
        'flex-row items-center justify-center gap-2 rounded-lg active:opacity-80',
        variantClassNames[variant].container,
        sizeClassNames[size],
        disabled && 'opacity-40',
        className,
      )}
    >
      {loading && <ActivityIndicator className={variantClassNames[variant].label} />}
      <ThemedText variant="headline" className={variantClassNames[variant].label}>
        {title}
      </ThemedText>
    </Pressable>
  );
}
