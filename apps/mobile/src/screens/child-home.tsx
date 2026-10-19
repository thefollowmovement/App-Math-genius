import type { SessionGoal } from '@math-genius/exercise-engine';
import type { DayPlan } from '@math-genius/shared';
import { Avatar, Button, Screen, ThemedText, View } from '@math-genius/ui';

import type { Child } from '@/data/children';
import type { PracticeStatus } from '@/data/practice/summary';
import { strings } from '@/i18n';
import { goalText } from '@/utils/routine-text';

const t = strings.childHome;

export type SyncState = 'offline' | 'syncing' | 'idle';

type ChildHomeProps = {
  child: Child;
  practice: PracticeStatus;
  /** What the routine plans today. */
  plan: DayPlan['kind'];
  /** Goal of a new session. */
  goal: SessionGoal;
  sync: SyncState;
  onStart: () => void;
  /** Shown when the device holds several profiles or a parent is signed in. */
  onSwitchProfile?: () => void;
};

const restDay = (plan: DayPlan['kind']) => plan === 'off' || plan === 'vacation';

function message(practice: PracticeStatus, plan: DayPlan['kind'], goal: SessionGoal): string {
  if (practice.status === 'unavailable') return t.notAvailable;
  if (practice.status === 'done') return t.todayDone;
  if (practice.status === 'in-progress') return t.ready;
  if (plan === 'off') return t.dayOff;
  if (plan === 'vacation') return t.vacation;
  return t.readyGoal(goalText(goal));
}

function startLabel(practice: PracticeStatus, plan: DayPlan['kind']): string {
  if (practice.status === 'in-progress') return t.resume(practice.percent);
  if (practice.status === 'done') return t.bonus;
  return restDay(plan) ? t.train : t.start;
}

export function ChildHome({
  child,
  practice,
  plan,
  goal,
  sync,
  onStart,
  onSwitchProfile,
}: ChildHomeProps) {
  return (
    <Screen centered>
      <View className="items-center gap-4">
        <Avatar name={child.display_name} size="lg" />
        <ThemedText variant="display" className="text-center">
          {t.greeting(child.display_name)}
        </ThemedText>
        <ThemedText className="text-center">{message(practice, plan, goal)}</ThemedText>
      </View>
      {practice.status === 'unavailable' ? null : (
        <Button
          size="lg"
          variant={practice.status === 'done' ? 'secondary' : 'primary'}
          title={startLabel(practice, plan)}
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
