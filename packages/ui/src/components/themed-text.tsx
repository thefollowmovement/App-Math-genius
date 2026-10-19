import type { ComponentProps } from 'react';

import { cx } from '../class-names';
import { Text } from '../primitives';
import { useOptionalTheme } from '../theme/theme-provider';

// Display, title, score and tag texts take the theme's font (--theme-font-heading).
const variantClassNames = {
  display: 'text-display font-heading',
  title: 'text-title font-heading',
  // A number or a big button's label (scores, rewards).
  score: 'text-score font-heading',
  // A short word in the heading font: a name, a counter, a sticker.
  tag: 'text-tag font-heading',
  // Large, in the text font: what must be read closely (an exercise's statement).
  statement: 'text-statement font-semibold',
  headline: 'text-headline',
  body: 'text-body',
  caption: 'text-caption',
  // Small capitals above a card's content (« MISSION DU JOUR »).
  label: 'text-label uppercase',
} as const;

const toneClassNames = {
  default: 'text-foreground',
  muted: 'text-muted',
  danger: 'text-danger',
  onPrimary: 'text-on-primary',
  onSecondary: 'text-on-secondary',
  onSuccess: 'text-on-success',
  onAccent: 'text-on-accent',
  // Colored texts, readable on the page and on cards in every theme.
  primary: 'text-primary-ink',
  secondary: 'text-secondary-ink',
  accent: 'text-accent-ink',
  success: 'text-success-ink',
  fire: 'text-fire',
} as const;

// The theme's body font, for the themes that have one (the class would be empty otherwise).
const bodyFontClassNames = {
  display: undefined,
  title: undefined,
  score: undefined,
  tag: undefined,
  label: 'font-body-semibold',
  statement: 'font-body-semibold',
  headline: 'font-body-semibold',
  body: 'font-body',
  caption: 'font-body',
} as const;

export type ThemedTextVariant = keyof typeof variantClassNames;
export type ThemedTextTone = keyof typeof toneClassNames;

type ThemedTextProps = ComponentProps<typeof Text> & {
  variant?: ThemedTextVariant;
  /** Defaults to `muted` for captions and labels, `default` otherwise. */
  tone?: ThemedTextTone;
};

/**
 * Text drawn from the typography scale. The color comes from `tone` (one color class per text);
 * `className` is for layout only (margins, alignment).
 */
export function ThemedText({ variant = 'body', tone, className, ...props }: ThemedTextProps) {
  const resolvedTone = tone ?? (variant === 'caption' || variant === 'label' ? 'muted' : 'default');
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
