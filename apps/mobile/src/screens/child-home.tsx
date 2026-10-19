import { Avatar, Button, Screen, ThemedText, View } from '@math-genius/ui';

import type { Child } from '@/data/children';
import type { PracticeStatus } from '@/data/practice/summary';
import { strings } from '@/i18n';

const t = strings.childHome;

export type SyncState = 'offline' | 'syncing' | 'idle';

type ChildHomeProps = {
  child: Child;
  practice: PracticeStatus;
  sync: SyncState;
  onStart: () => void;
  /** Shown when the device holds several profiles or a parent is signed in. */
  onSwitchProfile?: () => void;
};

const messages: Record<PracticeStatus['status'], string> = {
  unavailable: t.notAvailable,
  ready: t.ready,
  'in-progress': t.ready,
  done: t.todayDone,
};

function startLabel(practice: PracticeStatus): string {
  if (practice.status === 'in-progress') return t.resume(practice.percent);
  return practice.status === 'done' ? t.bonus : t.start;
}

export function ChildHome({ child, practice, sync, onStart, onSwitchProfile }: ChildHomeProps) {
  return (
    <Screen centered>
      <View className="items-center gap-4">
        <Avatar name={child.display_name} size="lg" />
        <ThemedText variant="display" className="text-center">
          {t.greeting(child.display_name)}
        </ThemedText>
        <ThemedText className="text-center">{messages[practice.status]}</ThemedText>
      </View>
      {practice.status === 'unavailable' ? null : (
        <Button
          size="lg"
          variant={practice.status === 'done' ? 'secondary' : 'primary'}
          title={startLabel(practice)}
          onPress={onStart}
        />
      )}
      {sync === 'idle' ? null : (
        <ThemedText variant="caption" className="text-center" accessibilityLiveRegion="polite">
          {sync === 'offline' ? t.offline : t.syncing}
        </ThemedText>
      )}
      {onSwitchProfile ? (
        <Button variant="ghost" title={t.switchProfile} onPress={onSwitchProfile} />
      ) : null}
    </Screen>
  );
}
