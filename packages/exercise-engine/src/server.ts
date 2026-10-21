import { type SkillCode, isErrorTypeCode, isSkillCode } from '@math-genius/curriculum';
import { GRADES, type Grade } from '@math-genius/shared';

import type { MasteryMap, MasteryRecord } from './adaptive/mastery';
import {
  type LearnerProfile,
  type ProfileAttempt,
  type ProfileSession,
  type ProfileSessionKind,
  learnerProfile,
} from './adaptive/profile';
import { profileSummary } from './adaptive/profile-summary';
import { type ItemRatings, itemKey } from './adaptive/ratings';
import type { Slot } from './adaptive/session';
import { DIFFICULTIES, type Difficulty } from './exercise';

/**
 * What the Edge Functions run (bundled into supabase/functions/_shared/engine.js): the regrading
 * of answers, and the learning profile from what the database gathers (profile_input).
 */
export { regrade, type ServerVerdict, type StoredAnswer } from './regrade';

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const rows = (value: unknown): Row[] => (Array.isArray(value) ? value.filter(isRow) : []);
const number = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
/** Postgres writes `+00:00`; the engine compares ISO dates as text. */
const date = (value: unknown): string | null =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? new Date(value).toISOString()
    : null;
const grade = (value: unknown): Grade | null => GRADES.find((item) => item === value) ?? null;
const difficulty = (value: unknown): Difficulty | null =>
  DIFFICULTIES.find((item) => item === value) ?? null;

// Mini-game rounds ('game') are left out: an arcade round says little about how the child learns.
const KINDS: readonly ProfileSessionKind[] = ['daily', 'bonus', 'boss', 'placement'];
const SLOTS: readonly Slot[] = ['current', 'review', 'automatism', 'challenge'];

function attemptOf(row: Row): ProfileAttempt | null {
  const skill = row.skill_code;
  const level = difficulty(row.difficulty);
  const answeredAt = date(row.answered_at);
  if (typeof skill !== 'string' || !isSkillCode(skill) || !level || !answeredAt) return null;
  const error = row.error_type;
  return {
    generatorId: typeof row.generator_id === 'string' ? row.generator_id : skill,
    skill,
    difficulty: level,
    slot: SLOTS.find((slot) => slot === row.slot) ?? 'current',
    twinOf: typeof row.twin_of === 'number' ? row.twin_of : null,
    correct: row.correct === true,
    timeMs: number(row.time_ms),
    answeredAt,
    learnerElo: number(row.learner_elo, 1000),
    error: typeof error === 'string' && isErrorTypeCode(error) ? error : null,
  };
}

function sessionOf(row: Row): ProfileSession | null {
  const kind = KINDS.find((item) => item === row.kind);
  const played = grade(row.grade);
  const startedAt = date(row.started_at);
  if (!kind || !played || !startedAt) return null;
  return {
    kind,
    grade: played,
    startedAt,
    completedAt: date(row.completed_at),
    attempts: rows(row.attempts)
      .map(attemptOf)
      .filter((attempt): attempt is ProfileAttempt => attempt !== null),
  };
}

function masteryOf(list: unknown): MasteryMap {
  const map: Partial<Record<SkillCode, MasteryRecord>> = {};
  for (const row of rows(list)) {
    const skill = row.skill_code;
    if (typeof skill !== 'string' || !isSkillCode(skill)) continue;
    map[skill] = {
      elo: number(row.elo, 1000),
      attempts: number(row.attempts_count),
      streak: number(row.sessions_streak),
      masteredAt: date(row.mastered_at),
      practicedAt: date(row.last_practiced_at),
    };
  }
  return map;
}

function ratingsOf(list: unknown): ItemRatings {
  const ratings: Record<string, number> = {};
  for (const row of rows(list)) {
    const level = difficulty(row.difficulty);
    if (typeof row.generator_id !== 'string' || !level) continue;
    ratings[itemKey(row.generator_id, level)] = number(row.rating, 1000);
  }
  return ratings;
}

/**
 * The profile and its summary from profile_input's JSON, or null when there is nothing to compute
 * (no consent, unknown child).
 */
export function profileFromInput(
  input: unknown,
  at: string,
): { profile: LearnerProfile; summary: string } | null {
  if (!isRow(input) || !isRow(input.child)) return null;
  const childGrade = grade(input.child.grade);
  if (!childGrade) return null;
  const timeZone = typeof input.child.timezone === 'string' ? input.child.timezone : 'Europe/Paris';
  const profile = learnerProfile({
    childGrade,
    mastery: masteryOf(input.mastery),
    sessions: rows(input.sessions)
      .map(sessionOf)
      .filter((session): session is ProfileSession => session !== null),
    itemRatings: ratingsOf(input.item_ratings),
    timeZone: validTimeZone(timeZone) ? timeZone : 'Europe/Paris',
    at,
  });
  const interests = Array.isArray(input.interests)
    ? input.interests.filter((name): name is string => typeof name === 'string')
    : [];
  return { profile, summary: profileSummary(profile, interests) };
}

function validTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone });
    return true;
  } catch {
    return false;
  }
}
