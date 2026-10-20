import {
  SKIPPED_ANSWER,
  buildExercise,
  gradeResponse,
  placementProgress,
  planNext,
  recordAttempt,
  type ExerciseResponse,
  type SkippedAnswer,
} from '@math-genius/exercise-engine';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  completeSession,
  plannerContext,
  recordAnswer,
  usePracticeStore,
} from '@/data/practice/practice-store';
import { syncNow } from '@/data/practice/sync';
import { haptics } from '@/lib/haptics';
import { retryNotice } from '@/utils/exercise-text';

/**
 * Runs the child's placement test: the next question comes from the engine (placement.ts), each
 * answer is saved on the device at once. No correction and no score: an answer leads straight to
 * the next question, until the engine has placed the child.
 */
export function usePlacementSession(childId: string, onFinished: () => void) {
  const session = usePracticeStore((state) => {
    const active = state.children[childId]?.active ?? null;
    return active?.kind === 'placement' ? active : null;
  });
  const context = useMemo(() => (session ? plannerContext(session) : null), [session]);
  const planned = useMemo(
    () => (context && session ? planNext(context, session.attempts) : null),
    [context, session],
  );
  const exercise = useMemo(() => (planned ? buildExercise(planned) : null), [planned]);

  const [notice, setNotice] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const shownAt = useRef(0);
  const exerciseKey = exercise ? `${session?.attempts.length}:${exercise.seed}` : null;

  useEffect(() => {
    if (exerciseKey) shownAt.current = Date.now();
  }, [exerciseKey]);

  const record = (response: ExerciseResponse | SkippedAnswer, correct: boolean) => {
    if (!session || !context || !planned) return;
    const now = new Date();
    const attempt = recordAttempt(context, session.attempts, planned, {
      correct,
      hintUsed: false,
      timeMs: now.getTime() - shownAt.current,
      answeredAt: now.toISOString(),
    });
    recordAnswer(childId, session.id, { ...attempt, response });
    // The same touch for every answer: nothing tells right from wrong.
    haptics.soft();
    if (planNext(context, [...session.attempts, attempt]) === null) {
      setFinished(true);
      completeSession(childId, session.id, now.toISOString());
      onFinished();
    }
    void syncNow();
  };

  return {
    session,
    /** The test just ended and its result is opening. */
    finished,
    exercise,
    progress: session ? placementProgress(session.grade, session.attempts) : 0,
    /** Answer to correct before it counts (unreadable, wrong form), as in a session. */
    notice,
    submit: (response: ExerciseResponse) => {
      if (!exercise) return;
      const verdict = gradeResponse(exercise, response);
      const retry = retryNotice(exercise, verdict);
      setNotice(retry);
      if (!retry) record(response, verdict.correct);
    },
    /** « Je ne sais pas »: a wrong answer, rather than a guess. */
    skip: () => {
      setNotice(null);
      record(SKIPPED_ANSWER, false);
    },
  };
}
