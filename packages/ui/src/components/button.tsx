import type { ReactNode } from 'react';

import { cx } from '../class-names';
import { ActivityIndicator, Pressable } from '../primitives';
import { ThemedText } from './themed-text';

// Filled buttons stand on the theme's relief: a solid shadow under them (none on flat themes).
const RELIEF = 'border-b-(length:--theme-relief-depth) border-b-relief';

const variantClassNames = {
  // The neon ones glow in their color (no halo on flat themes).
  primary: { container: cx('bg-primary glow-primary', RELIEF), tone: 'onPrimary' },
  secondary: { container: cx('bg-secondary', RELIEF), tone: 'onSecondary' },
  /** Validates an answer. */
  success: { container: cx('bg-success glow-success', RELIEF), tone: 'onSuccess' },
  /** Opens a reward. */
  accent: { container: cx('bg-accent glow-accent', RELIEF), tone: 'onAccent' },
  /** A second choice next to a filled button. */
  outline: { container: 'border-2 border-border bg-transparent', tone: 'default' },
  ghost: { container: 'bg-transparent', tone: 'default' },
  danger: { container: 'bg-transparent border border-danger', tone: 'danger' },
} as const;

// A large button's label is a short word in the heading font (« JOUER », « VALIDER »).
const sizeClassNames = {
  md: { container: 'min-h-12 px-5 py-3', label: 'headline' },
  lg: { container: 'min-h-16 px-6 py-3', label: 'score' },
} as const;

// The spinner takes the label's color.
const spinnerClassNames = {
  onPrimary: 'text-on-primary',
  onSecondary: 'text-on-secondary',
  onSuccess: 'text-on-success',
  onAccent: 'text-on-accent',
  default: 'text-foreground',
  danger: 'text-danger',
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
  /** Spoken label when the title is a symbol (◀, ▶), or says less than the context. */
  accessibilityLabel?: string;
  /** A small drawing before the title, in the label's color. */
  icon?: ReactNode;
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
  icon,
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
        sizeClassNames[size].container,
        disabled && 'opacity-40',
        className,
      )}
    >
      {icon && !loading ? icon : null}
      {loading && (
        <ActivityIndicator className={spinnerClassNames[variantClassNames[variant].tone]} />
      )}
      <ThemedText
        variant={sizeClassNames[size].label}
        tone={variantClassNames[variant].tone}
        className="shrink text-center"
      >
        {title}
      </ThemedText>
    </Pressable>
  );
}
