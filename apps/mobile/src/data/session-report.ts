import { getSkill, isSkillCode } from '@math-genius/curriculum';
import {
  DIFFICULTIES,
  buildExercise,
  rational,
  type Exercise,
  type ExerciseResponse,
} from '@math-genius/exercise-engine';
import type { Json } from '@math-genius/shared';

import { responseText, rightAnswerText } from '@/utils/exercise-text';

import type { AttemptRow, SessionRow } from './family-sessions';

/** Where a child stands today. "Manqué" comes with routines and their deadline. */
export type DayStatus = 'not_started' | 'in_progress' | 'done';

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
};

export function childDay(sessions: readonly SessionRow[]): ChildDay {
  if (sessions.length === 0) return { status: 'not_started', main: null };
  const daily = sessions.filter((session) => session.kind === 'daily');
  const main = (daily.length > 0 ? daily : sessions).at(-1) ?? null;
  const done = sessions.some((session) => session.completed_at !== null);
  const playing = sessions.some((session) => session.completed_at === null);
  return { status: playing ? 'in_progress' : done ? 'done' : 'not_started', main };
}

/** Today's state of each child, by child id. */
export function familyDay(
  childIds: readonly string[],
  sessions: readonly SessionRow[],
): Record<string, ChildDay> {
  return Object.fromEntries(
    childIds.map((id) => [id, childDay(sessions.filter((session) => session.child_id === id))]),
  );
}

const isObject = (value: Json): value is { [key: string]: Json | undefined } =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumberList = (value: Json | undefined): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'number');

/** The answer stored with an attempt, if it has a known shape (data from the server). */
export function parseResponse(value: Json): ExerciseResponse | null {
  if (!isObject(value)) return null;
  const { type } = value;
  if (type === 'numeric' && typeof value.text === 'string') return { type, text: value.text };
  if (type === 'choice' && typeof value.index === 'number') return { type, index: value.index };
  if (type === 'true-false' && typeof value.value === 'boolean') {
    return { type, value: value.value };
  }
  const position = value.value;
  if (type === 'number-line' && position !== undefined && isObject(position)) {
    const { num, den } = position;
    if (typeof num === 'number' && typeof den === 'number' && den !== 0) {
      return { type, value: rational(num, den) };
    }
  }
  if (type === 'order' && isNumberList(value.order)) return { type, order: value.order };
  if (type === 'match' && isNumberList(value.pairs)) return { type, pairs: value.pairs };
  if (type === 'fraction-shade' && typeof value.shaded === 'number') {
    return { type, shaded: value.shaded };
  }
  return null;
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

function rebuild(row: AttemptRow): Exercise | null {
  const difficulty = DIFFICULTIES.find((level) => level === row.difficulty);
  if (!difficulty) return null;
  try {
    return buildExercise({ generatorId: row.generator_id, difficulty, seed: row.seed });
  } catch {
    return null;
  }
}

/**
 * What the parent reads for each answer. The exercise is rebuilt by the engine from its
 * generator, difficulty and seed: the database never stores exercise texts.
 */
export function attemptViews(rows: readonly AttemptRow[]): AttemptView[] {
  return rows.map((row) => {
    const exercise = rebuild(row);
    const response = parseResponse(row.answer);
    return {
      position: row.position,
      skill: isSkillCode(row.skill_code) ? getSkill(row.skill_code).title : row.skill_code,
      prompt: exercise?.prompt ?? null,
      answer: exercise && response ? responseText(exercise, response) : null,
      rightAnswer: exercise && !row.is_correct ? rightAnswerText(exercise) : null,
      correct: row.is_correct,
      hintUsed: row.hint_used,
      seconds: Math.round(row.time_ms / 1000),
    };
  });
}
