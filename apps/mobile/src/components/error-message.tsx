import { ThemedText } from '@math-genius/ui';

import type { ErrorKind } from '@/data/errors';
import { strings } from '@/i18n';

export function ErrorMessage({ kind }: { kind: ErrorKind | null }) {
  if (!kind) return null;
  return (
    <ThemedText tone="danger" accessibilityRole="alert">
      {strings.errors[kind]}
    </ThemedText>
  );
}
