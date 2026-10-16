import type { ComponentProps } from 'react';

import { cx } from '../class-names';
import { Text } from '../primitives';

const variantClassNames = {
  display: 'text-display text-foreground',
  title: 'text-title text-foreground',
  headline: 'text-headline text-foreground',
  body: 'text-body text-foreground',
  caption: 'text-caption text-muted',
} as const;

export type ThemedTextVariant = keyof typeof variantClassNames;

type ThemedTextProps = ComponentProps<typeof Text> & {
  variant?: ThemedTextVariant;
};

/** Text drawn from the typography scale. `className` is for layout only (margins, alignment). */
export function ThemedText({ variant = 'body', className, ...props }: ThemedTextProps) {
  return <Text className={cx(variantClassNames[variant], className)} {...props} />;
}
