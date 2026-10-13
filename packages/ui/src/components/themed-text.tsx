import type { ComponentProps } from 'react';

import { cx } from '../class-names';
import { Text } from '../primitives';

const variantClassNames = {
  display: 'text-display',
  title: 'text-title',
  headline: 'text-headline',
  body: 'text-body',
  caption: 'text-caption',
} as const;

const toneClassNames = {
  default: 'text-foreground',
  muted: 'text-muted',
  danger: 'text-danger',
} as const;

export type ThemedTextVariant = keyof typeof variantClassNames;
export type ThemedTextTone = keyof typeof toneClassNames;

type ThemedTextProps = ComponentProps<typeof Text> & {
  variant?: ThemedTextVariant;
  /** Defaults to `muted` for captions and `default` otherwise. */
  tone?: ThemedTextTone;
};

/** Text drawn from the typography scale. `className` is for layout only (margins, alignment). */
export function ThemedText({ variant = 'body', tone, className, ...props }: ThemedTextProps) {
  const resolvedTone = tone ?? (variant === 'caption' ? 'muted' : 'default');
  return (
    <Text
      className={cx(variantClassNames[variant], toneClassNames[resolvedTone], className)}
      {...props}
    />
  );
}
