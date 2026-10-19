import { type Skill, type SkillCode, getSkill, isSkillCode, skills } from '@math-genius/curriculum';
import { type Grade, gradeRank } from '@math-genius/shared';

import type { Exercise } from '../exercise';
import { type Generator, generateExercise, generatorId } from '../generator';
import { generators as allGenerators } from '../generators';
import { type Rng, createRng, deriveSeed } from '../random';
import {
  type MasteryMap,
  type MasteryRecord,
  applyAnswer,
  closeSession,
  decayedElo,
  isAcquired,
  masteryOf,
  masteryStatus,
  startingRecord,
} from './mastery';
import { type ItemRatings, clampDifficulty, difficultyFor, itemRating } from './ratings';
import type { SessionAttempt, Slot } from './session';

/**
 * The next exercise is a pure function of the session context and the answers so far: a session
 * interrupted on the device resumes exactly where it stopped, and tests can replay any session.
 */
export type PlannerContext = {
  childGrade: Grade;
  /** Mastery when the session started. */
  mastery: MasteryMap;
  itemRatings: ItemRatings;
  /** ISO date. */
  startedAt: string;
  seed: number;
  /** Defaults to every generator of the engine. */
  generators?: readonly Generator[];
};

export type PlannedExercise = Pick<
  SessionAttempt,
  'generatorId' | 'skill' | 'difficulty' | 'seed' | 'slot' | 'twinOf' | 'reminder'
>;

/** 4 current, 3 review, 2 automatism and 1 challenge in 10 (40/30/20/10 in docs/specs.md). */
export const SLOT_PATTERN: readonly Slot[] = [
  'current',
  'review',
  'automatism',
  'current',
  'review',
  'current',
  'challenge',
  'review',
  'automatism',
  'current',
];
/** A failed exercise comes back with new numbers this many exercises later. */
export const TWIN_DELAY = 3;
/** Skills being learnt at the same time. */
export const CURRENT_SKILLS = 2;
/** Correct answers in a row that raise the session's difficulty by one. */
const STREAK_UP = 5;
/** Errors in a row that lower it by one and bring a reminder. */
const ERRORS_DOWN = 2;
/** Right answers in a row that lift a slowdown by one. */
const RECOVERY = 3;
const DAY_MS = 86_400_000;

const generatorsOf = (context: PlannerContext) => context.generators ?? allGenerators;

/** Skills the engine can practise for a grade: with a generator, at or below the grade. */
export function practicableSkills(
  childGrade: Grade,
  generators: readonly Generator[] = allGenerators,
): Skill[] {
  const withGenerator = new Set<string>(generators.map((generator) => generator.skill));
  return skills.filter(
    (skill) => withGenerator.has(skill.code) && gradeRank(skill.grade) <= gradeRank(childGrade),
  );
}

/** Mastery after the session's answers so far. */
export function liveMastery(
  context: PlannerContext,
  attempts: readonly SessionAttempt[],
): MasteryMap {
  const map: Partial<Record<SkillCode, MasteryRecord>> = { ...context.mastery };
  for (const attempt of attempts) {
    const record =
      map[attempt.skill] ??
      startingRecord(getSkill(attempt.skill), context.childGrade, context.mastery);
    map[attempt.skill] = applyAnswer(record, {
      item: itemRating(context.itemRatings, attempt.generatorId, attempt.difficulty),
      correct: attempt.correct,
      at: attempt.answeredAt,
    });
  }
  return map;
}

/** Mastery once the session is over; only completed sessions count toward "maîtrisée". */
export function finishSession(
  context: PlannerContext,
  attempts: readonly SessionAttempt[],
  options: { at: string; completed: boolean },
): MasteryMap {
  const map: Partial<Record<SkillCode, MasteryRecord>> = { ...liveMastery(context, attempts) };
  if (!options.completed) return map;
  for (const skill of new Set(attempts.map((attempt) => attempt.skill))) {
    const record = map[skill];
    if (record) map[skill] = closeSession(record, options.at);
  }
  return map;
}

type Pool = { current: SkillCode[]; review: SkillCode[]; automatism: SkillCode[] };

/**
 * Fading skills first, then the longest unpractised and the weakest; among equals, the most
 * recent grades (a 5e pupil revises 6e before CE2).
 */
function reviewPriority(record: MasteryRecord, at: string, gradesBack: number): number {
  const days = record.practicedAt ? (Date.parse(at) - Date.parse(record.practicedAt)) / DAY_MS : 14;
  const fading = masteryStatus(record, at) === 'to_review' ? 50 : 0;
  return fading + Math.min(30, days) + (100 - masteryOf(record, at)) / 5 - 4 * gradesBack;
}

function skillPool(context: PlannerContext, mastery: MasteryMap): Pool {
  const { childGrade, startedAt: at } = context;
  const generators = generatorsOf(context);
  const withGenerator = new Set<string>(generators.map((generator) => generator.skill));
  const recordOf = (skill: Skill) => (isSkillCode(skill.code) ? mastery[skill.code] : undefined);
  const orStart = (skill: Skill) =>
    recordOf(skill) ?? startingRecord(skill, childGrade, context.mastery);
  // A prerequisite without a generator cannot be practised yet, so it does not block.
  const acquired = (skill: Skill) =>
    !withGenerator.has(skill.code) || isAcquired(recordOf(skill), skill, childGrade, at);
  const unlocked = (skill: Skill) =>
    skill.prerequisites.every((code) => !isSkillCode(code) || acquired(getSkill(code)));

  const open = practicableSkills(childGrade, generators).filter(unlocked);
  const current = open
    .filter((skill) => !acquired(skill))
    .sort((a, b) => gradeRank(a.grade) - gradeRank(b.grade))
    .slice(0, CURRENT_SKILLS);
  const isCurrent = new Set<string>(current.map((skill) => skill.code));
  const review = open
    .filter((skill) => !isCurrent.has(skill.code))
    .filter((skill) => acquired(skill) || (recordOf(skill)?.attempts ?? 0) > 0)
    .map((skill) => ({
      skill,
      priority: reviewPriority(orStart(skill), at, gradeRank(childGrade) - gradeRank(skill.grade)),
    }))
    .sort((a, b) => b.priority - a.priority)
    .map(({ skill }) => skill);
  const automatism = open
    .filter((skill) => skill.automatism)
    .map((skill) => ({ skill, mastery: masteryOf(orStart(skill), at) }))
    .sort((a, b) => a.mastery - b.mastery)
    .map(({ skill }) => skill);

  const codes = (list: Skill[]) => list.map((skill) => skill.code).filter(isSkillCode);
  return { current: codes(current), review: codes(review), automatism: codes(automatism) };
}

/** First failed exercise old enough to come back, that has no twin yet. */
function dueTwin(attempts: readonly SessionAttempt[]): number | null {
  const twinned = new Set(attempts.map((attempt) => attempt.twinOf));
  const index = attempts.findIndex(
    (attempt, i) =>
      !attempt.correct &&
      attempt.twinOf === null &&
      !twinned.has(i) &&
      attempts.length - i >= TWIN_DELAY,
  );
  return index === -1 ? null : index;
}

/**
 * Session-wide difficulty shift on top of each skill's rating, and the skill to remind after
 * errors in a row. Both shifts are short-lived: a boost ends at the first error, a slowdown
 * eases after a few right answers.
 */
function sessionAdjustment(attempts: readonly SessionAttempt[]) {
  let offset = 0;
  let right = 0;
  let wrong = 0;
  let trigger: number | null = null;
  for (const [i, attempt] of attempts.entries()) {
    if (attempt.correct) {
      wrong = 0;
      right += 1;
      if (offset < 0 && right >= RECOVERY) [offset, right] = [offset + 1, 0];
      else if (right >= STREAK_UP) [offset, right] = [Math.min(1, offset + 1), 0];
    } else {
      right = 0;
      wrong += 1;
      offset = Math.min(0, offset);
      if (wrong >= ERRORS_DOWN) [offset, wrong, trigger] = [Math.max(-2, offset - 1), 0, i];
    }
  }
  const pending =
    trigger !== null && !attempts.slice(trigger + 1).some((attempt) => attempt.reminder);
  const reminderSkill = pending && trigger !== null ? (attempts[trigger]?.skill ?? null) : null;
  return { offset, reminderSkill };
}

function chooseSkill(
  slot: Slot,
  pool: Pool,
  attempts: readonly SessionAttempt[],
  rng: Rng,
): { slot: Slot; skill: SkillCode } | null {
  const recent = attempts.slice(-2).map((attempt) => attempt.skill);
  const fresh = (list: SkillCode[]) => {
    const others = list.filter((skill) => !recent.includes(skill));
    return others.length > 0 ? others : list;
  };
  const turns = attempts.filter(
    (attempt) =>
      (attempt.slot === 'current' || attempt.slot === 'challenge') &&
      attempt.twinOf === null &&
      !attempt.reminder,
  ).length;
  const pickers = {
    current: () => pool.current[turns % Math.max(1, pool.current.length)],
    review: () => {
      const list = fresh(pool.review).slice(0, 3);
      return list.length > 0 ? rng.pick(list) : undefined;
    },
    automatism: () => {
      const list = fresh(pool.automatism).slice(0, 2);
      return list.length > 0 ? rng.pick(list) : undefined;
    },
  };
  // Each slot falls back on others when it has no skill (a new CE2 child has nothing to review).
  const order: Record<Slot, [Slot, () => SkillCode | undefined][]> = {
    current: [
      ['current', pickers.current],
      ['review', pickers.review],
      ['automatism', pickers.automatism],
    ],
    review: [
      ['review', pickers.review],
      ['current', pickers.current],
      ['automatism', pickers.automatism],
    ],
    automatism: [
      ['automatism', pickers.automatism],
      ['review', pickers.review],
      ['current', pickers.current],
    ],
    challenge: [
      ['challenge', pickers.current],
      ['challenge', pickers.review],
      ['automatism', pickers.automatism],
    ],
  };
  for (const [chosen, pick] of order[slot]) {
    const skill = pick();
    if (skill) return { slot: chosen, skill };
  }
  return null;
}

/** Next exercise of the session, or null when no skill can be practised for this grade. */
export function planNext(
  context: PlannerContext,
  attempts: readonly SessionAttempt[],
): PlannedExercise | null {
  const index = attempts.length;
  const rng = createRng(deriveSeed(context.seed, index));
  const seed = rng.int(0, 2 ** 31 - 1);
  const generators = generatorsOf(context);

  const twin = dueTwin(attempts);
  const original = twin === null ? undefined : attempts[twin];
  if (original) {
    const { generatorId: id, skill, difficulty, slot } = original;
    return { generatorId: id, skill, difficulty, seed, slot, twinOf: twin, reminder: false };
  }

  const mastery = liveMastery(context, attempts);
  const { offset, reminderSkill } = sessionAdjustment(attempts);
  const choice = reminderSkill
    ? { slot: 'current' as const, skill: reminderSkill }
    : chooseSkill(
        SLOT_PATTERN[index % SLOT_PATTERN.length] ?? 'current',
        skillPool(context, mastery),
        attempts,
        rng,
      );
  const candidates = choice
    ? generators.filter((generator) => generator.skill === choice.skill)
    : [];
  if (!choice || candidates.length === 0) return null;

  const generator = rng.pick(candidates);
  const id = generatorId(generator);
  const record =
    mastery[choice.skill] ??
    startingRecord(getSkill(choice.skill), context.childGrade, context.mastery);
  const base = difficultyFor(decayedElo(record, context.startedAt), (difficulty) =>
    itemRating(context.itemRatings, id, difficulty),
  );
  // A challenge goes one notch up, unless the child is already struggling in this session.
  const recent = attempts.slice(-10);
  const struggling = recent.filter((attempt) => attempt.correct).length < 0.7 * recent.length;
  const challenge = choice.slot === 'challenge' && !struggling ? 1 : 0;
  return {
    generatorId: id,
    skill: choice.skill,
    difficulty: clampDifficulty(base + offset + challenge),
    seed,
    slot: choice.slot,
    twinOf: null,
    reminder: reminderSkill !== null,
  };
}

/** The attempt to keep once the child has answered a planned exercise. */
export function recordAttempt(
  context: PlannerContext,
  attempts: readonly SessionAttempt[],
  planned: PlannedExercise,
  result: Pick<SessionAttempt, 'correct' | 'hintUsed' | 'timeMs' | 'answeredAt'>,
): SessionAttempt {
  const record =
    liveMastery(context, attempts)[planned.skill] ??
    startingRecord(getSkill(planned.skill), context.childGrade, context.mastery);
  return { ...planned, ...result, learnerElo: Math.round(decayedElo(record, result.answeredAt)) };
}

/** Builds the exercise of a planned (or recorded) step. */
export function buildExercise(
  step: Pick<SessionAttempt, 'generatorId' | 'difficulty' | 'seed'>,
  generators: readonly Generator[] = allGenerators,
): Exercise {
  const generator = generators.find((candidate) => generatorId(candidate) === step.generatorId);
  if (!generator) throw new Error(`Unknown generator ${step.generatorId}`);
  return generateExercise(generator, step.difficulty, step.seed);
}
