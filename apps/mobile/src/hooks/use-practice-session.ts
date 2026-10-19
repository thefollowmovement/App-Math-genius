import {
  buildExercise,
  gradeResponse,
  planNext,
  recordAttempt,
  sessionProgress,
  type Exercise,
  type ExerciseResponse,
  type PlannedExercise,
} from '@math-genius/exercise-engine';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  completeSession,
  plannerContext,
  recordAnswer,
  usePracticeStore,
} from '@/data/practice/practice-store';
import { comboOf, sessionCount } from '@/data/practice/summary';
import { syncNow } from '@/data/practice/sync';
import { haptics } from '@/lib/haptics';
import type { PracticeFeedback } from '@/screens/practice';
import { ECLAIR_MS } from '@/screens/practice/eclair-timer';
import { retryNotice } from '@/utils/exercise-text';

type Answered = { planned: PlannedExercise; exercise: Exercise; feedback: PracticeFeedback };

/**
 * Runs the child's active session: the next exercise comes from the engine, each answer is saved
 * on the device at once (and sent when possible), the answered exercise stays on screen with its
 * correction until the child continues.
 */
export function usePracticeSession(childId: string, onFinished: () => void) {
  const session = usePracticeStore((state) => state.children[childId]?.active ?? null);
  const context = useMemo(() => (session ? plannerContext(session) : null), [session]);
  const planned = useMemo(
    () => (context && session ? planNext(context, session.attempts) : null),
    [context, session],
  );
  const next = useMemo(() => (planned ? buildExercise(planned) : null), [planned]);

  const [answered, setAnswered] = useState<Answered | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [finished, setFinished] = useState(false);
  const shownAt = useRef(0);

  const step = answered?.planned ?? planned;
  const exercise = answered?.exercise ?? next;
  const exerciseKey = next ? `${session?.attempts.length}:${next.seed}` : null;

  useEffect(() => {
    if (exerciseKey) shownAt.current = Date.now();
  }, [exerciseKey]);

  const submit = (response: ExerciseResponse) => {
    if (!session || !context || !planned || !next || answered) return;
    const verdict = gradeResponse(next, response);
    const retry = retryNotice(next, verdict);
    setNotice(retry);
    if (retry) return;

    const now = new Date();
    const timeMs = now.getTime() - shownAt.current;
    const attempt = recordAttempt(context, session.attempts, planned, {
      correct: verdict.correct,
      hintUsed: hintShown,
      timeMs,
      answeredAt: now.toISOString(),
    });
    const { finished } = sessionProgress(session.goal, session.startedAt, [
      ...session.attempts,
      attempt,
    ]);
    recordAnswer(childId, session.id, { ...attempt, response });
    setAnswered({
      planned,
      exercise: next,
      feedback: {
        response,
        correct: verdict.correct,
        fast: verdict.correct && planned.slot === 'automatism' && timeMs < ECLAIR_MS,
        finished,
      },
    });
    if (verdict.correct) haptics.success();
    else haptics.soft();
    void syncNow();
  };

  const continueSession = () => {
    if (!session || !answered) return;
    if (answered.feedback.finished) {
      setFinished(true);
      completeSession(childId, session.id, new Date().toISOString());
      void syncNow();
      onFinished();
      return;
    }
    setAnswered(null);
    setNotice(null);
    setHintShown(false);
  };

  const status = session
    ? sessionProgress(session.goal, session.startedAt, session.attempts)
    : null;

  return {
    session,
    /** The session just ended and the summary is opening. */
    finished,
    step,
    exercise,
    progress: status?.progress ?? 0,
    /** Exercises or minutes done, toward the goal. */
    count: session && status ? sessionCount(session.goal, status) : null,
    /** Right answers in a row; the answer on screen is already saved, so it counts. */
    combo: comboOf(session?.attempts ?? []),
    feedback: answered?.feedback ?? null,
    notice,
    hintShown,
    showHint: () => setHintShown(true),
    submit,
    continueSession,
  };
}
