import type { SkillCode } from '@math-genius/curriculum';

import { type PlannerContext, finishSession, planNext, recordAttempt } from '../adaptive/planner';
import { DIFFICULTY_RATINGS, expectedSuccess } from '../adaptive/ratings';
import { type SessionAttempt, type SessionGoal, sessionProgress } from '../adaptive/session';
import { createRng } from '../random';

/** A virtual child: its true level on each skill decides whether it answers right. */
export type Learner = (skill: SkillCode) => number;

export const at = (startedAt: string, seconds: number) =>
  new Date(Date.parse(startedAt) + seconds * 1000).toISOString();

/** Plays a session until the planner says it is finished, answering every 20 seconds. */
export function simulateSession(
  context: PlannerContext,
  learner: Learner,
  goal: SessionGoal = { type: 'duration', minutes: 15 },
) {
  const rng = createRng(context.seed ^ 0x2545f491);
  const attempts: SessionAttempt[] = [];
  for (;;) {
    const planned = planNext(context, attempts);
    if (!planned) break;
    const chance = expectedSuccess(learner(planned.skill), DIFFICULTY_RATINGS[planned.difficulty]);
    attempts.push(
      recordAttempt(context, attempts, planned, {
        correct: rng.chance(chance),
        hintUsed: false,
        timeMs: 9000,
        answeredAt: at(context.startedAt, (attempts.length + 1) * 20),
      }),
    );
    if (sessionProgress(goal, context.startedAt, attempts).finished) break;
  }
  const end = attempts.at(-1)?.answeredAt ?? context.startedAt;
  const mastery = finishSession(context, attempts, { at: end, completed: true });
  return { attempts, mastery };
}
