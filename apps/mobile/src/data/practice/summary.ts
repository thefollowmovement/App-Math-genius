import { getSkill } from '@math-genius/curriculum';
import {
  finishSession,
  masteryOf,
  practicableSkills,
  sessionProgress,
  startingRecord,
  type SessionGoal,
  type SessionProgress,
} from '@math-genius/exercise-engine';
import type { Grade } from '@math-genius/shared';

import {
  plannerContext,
  type ChildPractice,
  type SessionKind,
  type StoredSession,
} from './practice-store';

export type SessionSummary = {
  kind: SessionKind;
  goalMet: boolean;
  answered: number;
  correct: number;
  minutes: number;
  /** Up to three skills whose mastery went up the most, with their new mastery (0 to 100). */
  progressed: { title: string; mastery: number }[];
};

export function summarize(session: StoredSession): SessionSummary {
  const progress = sessionProgress(session.goal, session.startedAt, session.attempts);
  const at = session.completedAt ?? session.attempts.at(-1)?.answeredAt ?? session.startedAt;
  const after = finishSession(plannerContext(session), session.attempts, { at, completed: true });
  const skills = [...new Set(session.attempts.map((attempt) => attempt.skill))];

  const progressed = skills
    .map((code) => {
      const skill = getSkill(code);
      const start =
        session.masteryAtStart[code] ??
        startingRecord(skill, session.grade, session.masteryAtStart);
      const end = after[code];
      const before = masteryOf(start, session.startedAt);
      return { title: skill.title, before, mastery: end ? masteryOf(end, at) : before };
    })
    .filter(({ before, mastery }) => mastery > before)
    .sort((a, b) => b.mastery - b.before - (a.mastery - a.before))
    .slice(0, 3)
    .map(({ title, mastery }) => ({ title, mastery }));

  return {
    kind: session.kind,
    goalMet: progress.goalMet,
    answered: progress.answered,
    correct: progress.correct,
    minutes: Math.max(1, Math.round(progress.activeMs / 60_000)),
    progressed,
  };
}

export type PracticeStatus =
  | { status: 'unavailable' }
  | { status: 'ready' }
  | { status: 'in-progress'; percent: number }
  | { status: 'done' };

/** What the child's home offers today. */
export function practiceStatus(
  child: ChildPractice | undefined,
  grade: Grade,
  today: string,
): PracticeStatus {
  if (practicableSkills(grade).length === 0) return { status: 'unavailable' };
  const active = child?.active;
  if (active && active.localDate === today && active.attempts.length > 0) {
    const { progress } = sessionProgress(active.goal, active.startedAt, active.attempts);
    return { status: 'in-progress', percent: Math.min(99, Math.round(progress * 100)) };
  }
  return child?.lastDailyDate === today ? { status: 'done' } : { status: 'ready' };
}

/** How far the session has gone toward its goal: exercises, or whole minutes of active time. */
export function sessionCount(
  goal: SessionGoal,
  progress: Pick<SessionProgress, 'answered' | 'activeMs'>,
): { done: number; total: number; unit: 'exercises' | 'minutes' } {
  return goal.type === 'count'
    ? { done: progress.answered, total: goal.count, unit: 'exercises' }
    : { done: Math.floor(progress.activeMs / 60_000), total: goal.minutes, unit: 'minutes' };
}

/** Right answers in a row at the end of the session so far (the combo). */
export function comboOf(attempts: readonly { correct: boolean }[]): number {
  const lastWrong = attempts.findLastIndex((attempt) => !attempt.correct);
  return attempts.length - 1 - lastWrong;
}

/** Stars of a validated mission, out of 3: 60 %, 75 % and 90 % of right answers. */
export function starsOf({ goalMet, answered, correct }: SessionSummary): number {
  if (!goalMet || answered === 0) return 0;
  const rate = correct / answered;
  return [0.6, 0.75, 0.9].filter((threshold) => rate >= threshold).length;
}
