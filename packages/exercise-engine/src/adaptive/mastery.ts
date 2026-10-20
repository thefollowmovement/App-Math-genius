import { type Skill, type SkillCode, getSkill, isSkillCode } from '@math-genius/curriculum';
import { type Grade, gradeRank } from '@math-genius/shared';

import { updateRatings } from './ratings';

/** à découvrir → en cours → maîtrisée → à réviser (docs/specs.md, Adaptativité). */
export type MasteryStatus = 'to_discover' | 'in_progress' | 'mastered' | 'to_review';

/** What the app remembers of a child on one skill. */
export type MasteryRecord = {
  /** Child's rating on the skill; mastery is derived from it. */
  elo: number;
  attempts: number;
  /** Completed sessions in a row that ended with a mastery of 80 or more. */
  streak: number;
  /** First time the skill reached "maîtrisée" (ISO date), kept when it fades. */
  masteredAt: string | null;
  /** Last answer on the skill (ISO date). */
  practicedAt: string | null;
};

export type MasteryMap = Readonly<Partial<Record<SkillCode, MasteryRecord>>>;

export const MASTERY_THRESHOLD = 80;
export const SESSIONS_TO_MASTER = 2;
/** An earlier-grade skill stops being presumed known after this many answers below 70. */
const EVIDENCE_ATTEMPTS = 4;
/** Mastery under which practice withdraws that presumption, and the test's acquisition. */
export const PRESUMED_THRESHOLD = 70;

const DAY_MS = 86_400_000;

/**
 * Starting ratings: earlier grades are presumed known (difficulty 3 at about 80 % success),
 * the child's own grade starts at difficulty 2, later grades lower still. The placement test
 * (placement.ts) replaces these guesses with records of its own.
 */
const SAME_GRADE_ELO = 1150;
const gradeShift = (skill: Skill, childGrade: Grade) => {
  const order = gradeRank(skill.grade) - gradeRank(childGrade);
  return order < 0 ? 300 : order === 0 ? 0 : -200;
};
/** Weight of the default guess against the answers given on other skills. */
const PRIOR_WEIGHT = 10;

/**
 * Record of a skill never practised. With `known` (the child's other records), the guess
 * follows the child's level on the skills already practised: a child who struggles in CM1
 * does not start CE2 reviews at difficulty 3.
 */
export function startingRecord(
  skill: Skill,
  childGrade: Grade,
  known: MasteryMap = {},
): MasteryRecord {
  let total = SAME_GRADE_ELO * PRIOR_WEIGHT;
  let weight = PRIOR_WEIGHT;
  for (const [code, record] of Object.entries(known)) {
    if (!record || record.attempts === 0 || !isSkillCode(code)) continue;
    const evidence = Math.min(10, record.attempts);
    total += (record.elo - gradeShift(getSkill(code), childGrade)) * evidence;
    weight += evidence;
  }
  const elo = Math.round(total / weight) + gradeShift(skill, childGrade);
  return { elo, attempts: 0, streak: 0, masteredAt: null, practicedAt: null };
}

/** 0 to 100: rating 800 (difficulty 1 at 50 %) is 0, 1440 (difficulty 3 at 80 %) is 80. */
export const masteryFromElo = (elo: number) =>
  Math.min(100, Math.max(0, Math.round((elo - 800) / 8)));

/** Skills fade without practice: 4 rating points a day after two days, 200 at most. */
export function decayedElo(record: MasteryRecord, at: string): number {
  if (!record.practicedAt) return record.elo;
  const days = (Date.parse(at) - Date.parse(record.practicedAt)) / DAY_MS;
  return record.elo - Math.min(200, Math.max(0, days - 2) * 4);
}

export const masteryOf = (record: MasteryRecord, at: string) =>
  masteryFromElo(decayedElo(record, at));

export function masteryStatus(record: MasteryRecord, at: string): MasteryStatus {
  // A skill the placement test found acquired is mastered before any practice.
  if (record.attempts === 0 && !record.masteredAt) return 'to_discover';
  if (record.masteredAt)
    return masteryOf(record, at) >= MASTERY_THRESHOLD ? 'mastered' : 'to_review';
  return 'in_progress';
}

/**
 * Whether a skill counts as known for the skills that require it. Earlier-grade skills are
 * presumed known until enough answers show otherwise. Once the child is `placed` (placement.ts),
 * the test's records say what is known: only an earlier-grade skill without a record (one the
 * test could not reach) is still presumed.
 */
export function isAcquired(
  record: MasteryRecord | undefined,
  skill: Skill,
  childGrade: Grade,
  at: string,
  placed = false,
): boolean {
  if (record?.masteredAt) return true;
  if (gradeRank(skill.grade) >= gradeRank(childGrade)) return false;
  if (!record) return true;
  if (placed) return false;
  return record.attempts < EVIDENCE_ATTEMPTS || masteryOf(record, at) >= PRESUMED_THRESHOLD;
}

/** The record after one answer on an item rated `item`. */
export function applyAnswer(
  record: MasteryRecord,
  answer: { item: number; correct: boolean; at: string },
): MasteryRecord {
  const { learner } = updateRatings({
    learner: decayedElo(record, answer.at),
    item: answer.item,
    correct: answer.correct,
    learnerAttempts: record.attempts,
  });
  return { ...record, elo: learner, attempts: record.attempts + 1, practicedAt: answer.at };
}

/** At the end of a completed session: counts it toward "maîtrisée (≥ 80 sur 2 séances)". */
export function closeSession(record: MasteryRecord, at: string): MasteryRecord {
  const streak = masteryOf(record, at) >= MASTERY_THRESHOLD ? record.streak + 1 : 0;
  const masteredAt = record.masteredAt ?? (streak >= SESSIONS_TO_MASTER ? at : null);
  return { ...record, streak, masteredAt };
}
