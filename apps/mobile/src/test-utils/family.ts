import type { Exercise, ExerciseResponse } from '@math-genius/exercise-engine';

import type { AttemptRow, SessionRow } from '@/data/family-sessions';

export function sessionRow(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: 'session-1',
    child_id: 'lea',
    kind: 'daily',
    local_date: '2026-10-16',
    started_at: '2026-10-16T15:02:00.000Z',
    completed_at: '2026-10-16T15:19:00.000Z',
    answered: 45,
    score: 36,
    duration_s: 900,
    goal_met: true,
    flagged: false,
    ...overrides,
  };
}

/** The row stored for an answer to a real exercise. */
export function attemptRow(
  exercise: Exercise,
  response: ExerciseResponse,
  overrides: Partial<AttemptRow> = {},
): AttemptRow {
  return {
    position: 0,
    skill_code: exercise.skill,
    generator_id: exercise.generatorId,
    difficulty: exercise.difficulty,
    seed: exercise.seed,
    answer: JSON.parse(JSON.stringify(response)),
    is_correct: false,
    hint_used: false,
    time_ms: 8400,
    ...overrides,
  };
}
