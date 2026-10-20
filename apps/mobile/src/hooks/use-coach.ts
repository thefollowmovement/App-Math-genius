import type { Exercise, ExerciseResponse } from '@math-genius/exercise-engine';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { fetchCoach, sendCoachFeedback } from '@/data/coach';
import type { CoachExplanation } from '@/data/coach-model';
import type { CoachView } from '@/screens/practice/coach-bubble';

/** The explanations already shown for this answer, for « Explique autrement ». */
type Asked = { key: string | null; shown: CoachExplanation[] };

const answerKey = (exercise: Exercise | null, response: ExerciseResponse | null) =>
  exercise && response
    ? [exercise.generatorId, exercise.difficulty, exercise.seed, JSON.stringify(response)].join(':')
    : null;

/**
 * The coach after a wrong answer (docs/specs.md, Coach IA): an explanation from the gateway,
 * checked again here, or nothing when the device is offline, the AI is off or nothing could be
 * shown; the generator's correction is on screen in any case. « Explique autrement » asks for
 * another one, leaving out those shown. Explanations are not kept on the device.
 */
export function useCoach(
  childId: string,
  exercise: Exercise | null,
  response: ExerciseResponse | null,
) {
  const key = answerKey(exercise, response);
  const [asked, setAsked] = useState<Asked>({ key: null, shown: [] });
  const shown = asked.key === key ? asked.shown : [];
  const exclude = shown.map((item) => item.id);
  const query = useQuery({
    queryKey: ['coach', childId, key, exclude],
    enabled: key !== null,
    queryFn: () => (exercise && response ? fetchCoach(childId, exercise, response, exclude) : null),
    retry: false,
    staleTime: Infinity,
    gcTime: 10 * 60_000,
  });

  const latest = query.data ?? null;
  const previous = shown.at(-1) ?? null;
  let view: CoachView | null = null;
  if (key !== null) {
    if (latest) view = { status: 'shown', explanation: latest.explanation, more: true };
    else if (query.fetchStatus === 'fetching') view = { status: 'thinking' };
    // No other explanation: the last one stays.
    else if (previous) view = { status: 'shown', explanation: previous.explanation, more: false };
  }

  const feedback = (explanation: CoachExplanation | null, understood: boolean) => {
    if (explanation) {
      sendCoachFeedback(childId, explanation.id, understood).catch(() => undefined);
    }
  };
  return {
    view,
    understood: () => feedback(latest ?? previous, true),
    explainAgain: () => {
      if (!latest || key === null) return;
      feedback(latest, false);
      setAsked({ key, shown: [...shown, latest] });
    },
  };
}
