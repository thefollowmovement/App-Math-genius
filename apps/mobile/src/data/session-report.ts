import { getSkill, isSkillCode } from '@math-genius/curriculum';
import {
  isSkippedAnswer,
  parseStoredResponse,
  rebuildExercise,
} from '@math-genius/exercise-engine';
import type { DayPlan } from '@math-genius/shared';

import { strings } from '@/i18n';
import { responseText, rightAnswerText } from '@/utils/exercise-text';

import type { AttemptRow, SessionRow } from './family-sessions';

/** Where a child stands today, from their sessions and what the routine plans. */
export type DayStatus = 'not_started' | 'in_progress' | 'done' | 'missed' | 'off' | 'vacation';

/** A session as the parent reads it. */
export type SessionState = 'in_progress' | 'validated' | 'not_validated';

export const sessionState = (session: SessionRow): SessionState => {
  if (session.completed_at === null) return 'in_progress';
  return session.goal_met ? 'validated' : 'not_validated';
};

export const minutesOf = (session: Pick<SessionRow, 'duration_s'>) =>
  Math.round(session.duration_s / 60);

export type ChildDay = {
  status: DayStatus;
  /** The session to sum the day up with: the daily one, else the latest. */
  main: SessionRow | null;
  /** Planned start, in minutes since midnight, while the session is still to come. */
  startsAt: number | null;
};

const NOTHING_PLANNED: DayPlan = { kind: 'no_routine' };

/**
 * A finished session makes the day done, even late. Past the deadline of a planned day, nothing
 * finished means missed (the server reminders apply the same rule). On a day off or during
 * holidays, a child who plays anyway still shows as playing or done.
 */
export function childDay(
  sessions: readonly SessionRow[],
  plan: DayPlan = NOTHING_PLANNED,
  minute = 0,
): ChildDay {
  const daily = sessions.filter((session) => session.kind === 'daily');
  const main = (daily.length > 0 ? daily : sessions).at(-1) ?? null;
  const planned = plan.kind === 'planned' ? plan : null;
  const day = (status: DayStatus): ChildDay => ({
    status,
    main,
    startsAt: status === 'not_started' && planned && minute < planned.start ? planned.start : null,
  });

  if (sessions.some((session) => session.completed_at !== null)) return day('done');
  if (planned && minute >= planned.deadline) return day('missed');
  if (sessions.length > 0) return day('in_progress');
  if (plan.kind === 'off' || plan.kind === 'vacation') return day(plan.kind);
  return day('not_started');
}

/** Today's state of each child, by child id. */
export function familyDay(
  childIds: readonly string[],
  sessions: readonly SessionRow[],
  planOf: (childId: string) => DayPlan = () => NOTHING_PLANNED,
  minute = 0,
): Record<string, ChildDay> {
  return Object.fromEntries(
    childIds.map((id) => [
      id,
      childDay(
        sessions.filter((session) => session.child_id === id),
        planOf(id),
        minute,
      ),
    ]),
  );
}

export type AttemptView = {
  position: number;
  skill: string;
  /** Null when this version of the app no longer knows the exercise's generator. */
  prompt: string | null;
  answer: string | null;
  /** Shown for mistakes only. */
  rightAnswer: string | null;
  correct: boolean;
  hintUsed: boolean;
  seconds: number;
};

/**
 * What the parent reads for each answer. The exercise is rebuilt by the engine from its
 * generator, difficulty and seed: the database never stores exercise texts.
 */
export function attemptViews(rows: readonly AttemptRow[]): AttemptView[] {
  return rows.map((row) => {
    const exercise = rebuildExercise(row);
    const response = parseStoredResponse(row.answer);
    return {
      position: row.position,
      skill: isSkillCode(row.skill_code) ? getSkill(row.skill_code).title : row.skill_code,
      prompt: exercise?.prompt ?? null,
      answer: isSkippedAnswer(row.answer)
        ? strings.sessionDetail.skipped
        : exercise && response
          ? responseText(exercise, response)
          : null,
      rightAnswer: exercise && !row.is_correct ? rightAnswerText(exercise) : null,
      correct: row.is_correct,
      hintUsed: row.hint_used,
      seconds: Math.round(row.time_ms / 1000),
    };
  });
}
