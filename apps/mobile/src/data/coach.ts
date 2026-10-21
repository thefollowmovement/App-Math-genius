import type { Exercise, ExerciseResponse } from '@math-genius/exercise-engine';

import { supabase } from '@/lib/supabase';

import { coachExplanation, coachRequest, type CoachExplanation } from './coach-model';

/**
 * The coach's explanation of a wrong answer (supabase/functions/ai-gateway), or null: the AI is
 * off, over budget, or wrote nothing showable. The app then shows the generator's correction.
 */
export async function fetchCoach(
  childId: string,
  exercise: Exercise,
  response: ExerciseResponse,
  exclude: readonly string[],
): Promise<CoachExplanation | null> {
  const { data, error } = await supabase.functions.invoke('ai-gateway', {
    body: coachRequest(childId, exercise, response, exclude),
  });
  if (error) throw error;
  return coachExplanation(data, exercise, response);
}

/** « J'ai compris » (true) or « Explique autrement » (false): how well each explanation works. */
export async function sendCoachFeedback(
  childId: string,
  explanationId: string,
  understood: boolean,
) {
  const { error } = await supabase.rpc('coach_feedback', {
    p_child_id: childId,
    p_explanation_id: explanationId,
    p_understood: understood,
  });
  if (error) throw error;
}
