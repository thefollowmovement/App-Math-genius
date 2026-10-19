import { getSkill } from '@math-genius/curriculum';
import type { SessionGoal } from '@math-genius/exercise-engine';
import type { DayPlan } from '@math-genius/shared';
import { Button, ThemedText, View, cx } from '@math-genius/ui';

import { Icon } from '@/components/game/icons';
import { MISSION_SEGMENTS, missionSegments, type Stop } from '@/data/mission-model';
import type { PracticeStatus } from '@/data/practice/summary';
import { strings } from '@/i18n';
import { goalText, timeText } from '@/utils/routine-text';

const t = strings.childHome;

type MissionCardProps = {
  practice: PracticeStatus;
  plan: DayPlan;
  goal: SessionGoal;
  /** Where the child stands on the world map: the mission's topic. */
  stop: Stop | null;
  onStart: () => void;
};

const restDay = (plan: DayPlan) => plan.kind === 'off' || plan.kind === 'vacation';

function label(practice: PracticeStatus, plan: DayPlan) {
  if (practice.status === 'done') return t.mission.done;
  if (plan.kind === 'off') return t.mission.off;
  if (plan.kind === 'vacation') return t.mission.vacation;
  return t.mission.daily;
}

/** Today's mission: its topic and goal, how much is done, and the big button to play. */
export function MissionCard({ practice, plan, goal, stop, onStart }: MissionCardProps) {
  const done = practice.status === 'done';
  const filled = missionSegments(practice);
  const goalLine = goalText(goal);
  const deadline = plan.kind === 'planned' && !done ? timeText(plan.deadline) : null;
  const percentDone = practice.status === 'in-progress' ? practice.percent : done ? 100 : 0;

  return (
    <View className="gap-4 rounded-lg border-3 border-primary bg-surface bg-linear-160 from-raised to-surface p-5 glow-primary">
      <View className="flex-row items-center justify-between gap-2">
        <ThemedText
          variant="label"
          tone={done ? 'success' : 'secondary'}
          accessibilityRole="header"
        >
          {label(practice, plan)}
        </ThemedText>
        {deadline ? (
          <View
            accessible
            accessibilityLabel={t.mission.before(deadline)}
            className="rounded-full bg-background px-3 py-1"
          >
            <ThemedText variant="label" tone="accent">
              {deadline}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <View className="gap-2">
        <ThemedText variant="title">
          {stop
            ? strings.map.islands[stop.island.domain].name
            : restDay(plan)
              ? t.mission.free
              : goalLine}
        </ThemedText>
        <ThemedText tone="muted">
          {practice.status === 'unavailable'
            ? t.notAvailable
            : stop
              ? t.mission.details(goalLine, getSkill(stop.node.code).title)
              : goalLine}
        </ThemedText>
      </View>
      {practice.status === 'unavailable' ? null : (
        <>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={t.mission.progress}
            accessibilityValue={{ min: 0, max: 100, now: percentDone }}
            className="flex-row gap-2"
          >
            {Array.from({ length: MISSION_SEGMENTS }, (_, index) => (
              <View
                key={index}
                className={cx(
                  'h-2 flex-1 rounded-full',
                  index < filled ? (done ? 'bg-success' : 'bg-primary') : 'bg-border',
                )}
              />
            ))}
          </View>
          <StartButton practice={practice} plan={plan} onStart={onStart} />
        </>
      )}
    </View>
  );
}

function StartButton({
  practice,
  plan,
  onStart,
}: {
  practice: PracticeStatus;
  plan: DayPlan;
  onStart: () => void;
}) {
  if (practice.status === 'in-progress') {
    return (
      <Button
        size="lg"
        title={t.resume}
        accessibilityLabel={t.resumeLabel(practice.percent)}
        icon={<Icon name="play" color="onPrimary" />}
        onPress={onStart}
      />
    );
  }
  if (practice.status === 'done') {
    return <Button size="lg" variant="secondary" title={t.bonus} onPress={onStart} />;
  }
  return (
    <Button
      size="lg"
      title={restDay(plan) ? t.train : t.start}
      icon={<Icon name="play" color="onPrimary" />}
      onPress={onStart}
    />
  );
}
