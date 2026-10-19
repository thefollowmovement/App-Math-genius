import { cx } from '../class-names';
import { ActivityIndicator, Pressable } from '../primitives';
import { ThemedText } from './themed-text';

// Filled buttons stand on the theme's relief: a solid shadow under them (none on flat themes).
const RELIEF = 'border-b-(length:--theme-relief-depth) border-b-relief';

const variantClassNames = {
  primary: { container: cx('bg-primary', RELIEF), label: 'text-on-primary', tone: 'onPrimary' },
  secondary: {
    container: cx('bg-secondary', RELIEF),
    label: 'text-on-secondary',
    tone: 'onSecondary',
  },
  ghost: { container: 'bg-transparent', label: 'text-foreground', tone: 'default' },
  danger: {
    container: 'bg-transparent border border-danger',
    label: 'text-danger',
    tone: 'danger',
  },
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
  /** Spoken label when the title is a symbol (◀, ▶). */
  accessibilityLabel?: string;
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
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
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
      <ThemedText variant="headline" tone={variantClassNames[variant].tone}>
        {title}
      </ThemedText>
    </Pressable>
  );
}
