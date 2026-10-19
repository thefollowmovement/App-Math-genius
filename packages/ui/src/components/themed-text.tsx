import type { ComponentProps } from 'react';

import { cx } from '../class-names';
import { Text } from '../primitives';
import { useOptionalTheme } from '../theme/theme-provider';

// Display and title texts take the theme's font (--theme-font-heading).
const variantClassNames = {
  display: 'text-display font-heading',
  title: 'text-title font-heading',
  // As large as a title, in the text font: what must be read closely (an exercise's statement).
  statement: 'text-title font-semibold',
  headline: 'text-headline',
  body: 'text-body',
  caption: 'text-caption',
} as const;

const toneClassNames = {
  default: 'text-foreground',
  muted: 'text-muted',
  danger: 'text-danger',
  onPrimary: 'text-on-primary',
  onSecondary: 'text-on-secondary',
  onSuccess: 'text-on-success',
} as const;

// The theme's body font, for the themes that have one (the class would be empty otherwise).
const bodyFontClassNames = {
  display: undefined,
  title: undefined,
  statement: 'font-body-semibold',
  headline: 'font-body-semibold',
  body: 'font-body',
  caption: 'font-body',
} as const;

export type ThemedTextVariant = keyof typeof variantClassNames;
export type ThemedTextTone = keyof typeof toneClassNames;

type ThemedTextProps = ComponentProps<typeof Text> & {
  variant?: ThemedTextVariant;
  /** Defaults to `muted` for captions and `default` otherwise. */
  tone?: ThemedTextTone;
};

/**
 * Text drawn from the typography scale. The color comes from `tone` (one color class per text);
 * `className` is for layout only (margins, alignment).
 */
export function ThemedText({ variant = 'body', tone, className, ...props }: ThemedTextProps) {
  const resolvedTone = tone ?? (variant === 'caption' ? 'muted' : 'default');
  // Outside a theme (a test, a fallback screen), body texts stay on the system font.
  const bodyFont = useOptionalTheme()?.typography.bodyFont;
  return (
    <Text
      className={cx(
        variantClassNames[variant],
        bodyFont && bodyFontClassNames[variant],
        toneClassNames[resolvedTone],
        className,
      )}
      {...props}
    />
  );
}
