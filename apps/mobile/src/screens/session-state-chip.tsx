import { cx, ThemedText, type ThemedTextTone, View } from '@math-genius/ui';

import type { SessionState } from '@/data/session-report';
import { strings } from '@/i18n';

const styles: Record<SessionState, { box: string; tone: ThemedTextTone }> = {
  in_progress: { box: 'bg-secondary', tone: 'onSecondary' },
  validated: { box: 'bg-success', tone: 'onSuccess' },
  not_validated: { box: 'border border-border bg-surface', tone: 'default' },
};

export function SessionStateChip({ state }: { state: SessionState }) {
  return (
    <View className={cx('rounded-full px-3 py-1', styles[state].box)}>
      <ThemedText variant="caption" tone={styles[state].tone}>
        {strings.todaySessions.states[state]}
      </ThemedText>
    </View>
  );
}
