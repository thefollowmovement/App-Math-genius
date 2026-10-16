import { Host } from '@expo/ui';
import { ThemedText, View } from '@math-genius/ui';
import type { ReactNode } from 'react';

type PickerFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

/** Label, native picker and messages, laid out like a TextField. */
export function PickerField({ label, hint, error, children }: PickerFieldProps) {
  return (
    <View className="gap-2">
      <ThemedText variant="caption" tone="default">
        {label}
      </ThemedText>
      <Host matchContents={{ vertical: true }}>{children}</Host>
      {hint ? <ThemedText variant="caption">{hint}</ThemedText> : null}
      {error ? (
        <ThemedText variant="caption" tone="danger">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
