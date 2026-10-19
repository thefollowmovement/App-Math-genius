import type { ComponentProps } from 'react';

import { cx } from '../class-names';
import { TextInput, View } from '../primitives';
import { useTheme } from '../theme';
import { ThemedText } from './themed-text';

type TextFieldProps = Omit<ComponentProps<typeof TextInput>, 'className' | 'style'> & {
  label: string;
  /** Help shown under the field. */
  hint?: string;
  /** Shown under the field, in the danger color, when set. */
  error?: string;
  className?: string;
};

export function TextField({ label, hint, error, className, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();

  return (
    <View className={cx('gap-2', className)}>
      <ThemedText variant="caption" tone="default">
        {label}
      </ThemedText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        className={cx(
          'rounded-md border bg-surface px-4 py-3 text-body text-foreground',
          error ? 'border-danger' : 'border-border',
        )}
        {...inputProps}
      />
      {hint ? <ThemedText variant="caption">{hint}</ThemedText> : null}
      {error ? (
        <ThemedText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
