import {
  placementResult,
  planNext,
  recordAttempt,
  type PlannerContext,
  type SessionAttempt,
} from '@math-genius/exercise-engine';

import type { PlacementAttemptRow, PlacementRows } from './placement';
import { placementReport } from './placement-report';

const START = '2026-10-20T17:00:00.000Z';

/** A CM1 test answered right on CE2 only, as the server stores it. */
function playedTest() {
  const context: PlannerContext = {
    childGrade: 'CM1',
    mastery: {},
    itemRatings: {},
    startedAt: START,
    seed: 4,
    placement: true,
  };
  const attempts: SessionAttempt[] = [];
  for (let planned = planNext(context, attempts); planned; planned = planNext(context, attempts)) {
    attempts.push(
      recordAttempt(context, attempts, planned, {
        correct: planned.skill.startsWith('ce2.'),
        hintUsed: false,
        timeMs: 9000,
        answeredAt: new Date(Date.parse(START) + (attempts.length + 1) * 25_000).toISOString(),
      }),
    );
  }
  const rows: PlacementAttemptRow[] = attempts.map((attempt, position) => ({
    position,
    skill_code: attempt.skill,
    generator_id: attempt.generatorId,
    difficulty: attempt.difficulty,
    is_correct: attempt.correct,
    verified: null,
    answered_at: attempt.answeredAt,
  }));
  return { attempts, rows, end: attempts.at(-1)?.answeredAt ?? START };
}

const session = (completed_at: string | null) => ({
  id: 'test-1',
  grade: 'CM1' as const,
  started_at: START,
  completed_at,
});

describe('placementReport', () => {
  it('reads the stored answers again with the engine, against the grade of the test', () => {
    const { attempts, rows, end } = playedTest();
    const report = placementReport({
      finished: { session: session(end), attempts: rows },
      inProgress: false,
    });
    const expected = placementResult('CM1', attempts, end);
    expect(report?.last).toMatchObject({
      grade: 'CM1',
      takenAt: end,
      strands: expected.strands,
      priorities: expected.priorities,
    });
    expect(report?.last?.strands.find((s) => s.strand === 'fractions')?.level).toBe('on_track');
  });

  it('trusts the server’s grading over the device’s', () => {
    const { rows, end } = playedTest();
    // The server found every answer wrong: nothing is passed, even on CE2.
    const regraded = rows.map((row) => ({ ...row, verified: false }));
    const report = placementReport({
      finished: { session: session(end), attempts: regraded },
      inProgress: false,
    });
    const levels = report?.last?.strands.filter((s) => s.level !== null).map((s) => s.level);
    expect(levels?.every((level) => level === 'to_consolidate')).toBe(true);
  });

  it('says when no test was taken, and when one is under way', () => {
    const none: PlacementRows = { finished: null, inProgress: true };
    expect(placementReport(none)).toEqual({ inProgress: true, last: null });
    expect(placementReport(undefined)).toBeUndefined();
  });
});
