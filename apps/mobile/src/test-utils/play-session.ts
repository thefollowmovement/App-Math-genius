import {
  buildExercise,
  gradeResponse,
  planNext,
  recordAttempt,
  sessionProgress,
} from '@math-genius/exercise-engine';

import {
  childPractice,
  completeSession,
  plannerContext,
  recordAnswer,
  type StoredSession,
} from '@/data/practice/practice-store';

import { rightResponse, wrongResponse } from './responses';

/**
 * Plays an open session like a child answering every 20 seconds, wrong once in five, until the
 * session ends or `maxAnswers` answers.
 */
export function playSession(childId: string, session: StoredSession, maxAnswers = Infinity) {
  const context = plannerContext(session);
  for (let i = 0; i < maxAnswers; i++) {
    const current = childPractice(childId).active;
    if (!current || current.id !== session.id) break;
    const planned = planNext(context, current.attempts);
    if (!planned) break;
    const exercise = buildExercise(planned);
    const response = i % 5 === 3 ? wrongResponse(exercise) : rightResponse(exercise);
    const answeredAt = new Date(Date.parse(session.startedAt) + (i + 1) * 20_000).toISOString();
    const attempt = recordAttempt(context, current.attempts, planned, {
      correct: gradeResponse(exercise, response).correct,
      hintUsed: false,
      timeMs: 9000,
      answeredAt,
    });
    recordAnswer(childId, session.id, { ...attempt, response });
    if (sessionProgress(session.goal, session.startedAt, [...current.attempts, attempt]).finished) {
      completeSession(childId, session.id, answeredAt);
    }
  }
}
