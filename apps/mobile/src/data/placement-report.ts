import { type SkillCode, isSkillCode } from '@math-genius/curriculum';
import {
  DIFFICULTIES,
  placementResult,
  type StrandResult,
  type TestAnswer,
} from '@math-genius/exercise-engine';
import type { Grade } from '@math-genius/shared';

import type { PlacementAttemptRow, PlacementRows } from './placement';

export type PlacementReport = {
  /** A newer test is under way on the child's device. */
  inProgress: boolean;
  /** The last test finished; null before the first one. */
  last: {
    takenAt: string;
    /** The grade the child was in: the test is read against it. */
    grade: Grade;
    strands: StrandResult[];
    priorities: SkillCode[];
  } | null;
};

/** An answer as the engine reads it; the server's verdict wins over the device's when known. */
function testAnswer(row: PlacementAttemptRow): TestAnswer[] {
  const difficulty = DIFFICULTIES.find((level) => level === row.difficulty);
  if (!difficulty || !isSkillCode(row.skill_code)) return [];
  return [
    {
      skill: row.skill_code,
      generatorId: row.generator_id,
      difficulty,
      correct: row.verified ?? row.is_correct,
      answeredAt: row.answered_at,
    },
  ];
}

/** What the parent reads of the test (docs/specs.md, Résultat parent): a level per strand, three priorities. */
export function placementReport(rows: PlacementRows | undefined): PlacementReport | undefined {
  if (!rows) return undefined;
  const { finished, inProgress } = rows;
  if (!finished?.session.completed_at) return { inProgress, last: null };
  const { session, attempts } = finished;
  const takenAt = session.completed_at ?? session.started_at;
  const result = placementResult(session.grade, attempts.flatMap(testAnswer), takenAt);
  return {
    inProgress,
    last: { takenAt, grade: session.grade, strands: result.strands, priorities: result.priorities },
  };
}
