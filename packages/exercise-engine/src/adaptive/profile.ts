import {
  type ErrorTypeCode,
  type SkillCode,
  STRANDS,
  type Strand,
  getErrorType,
  getSkill,
  isSkillCode,
} from '@math-genius/curriculum';
import { type Grade, gradeRank } from '@math-genius/shared';

import {
  MASTERY_THRESHOLD,
  PRESUMED_THRESHOLD,
  type MasteryMap,
  masteryOf,
  masteryStatus,
} from './mastery';
import { placementResult } from './placement';
import { type ItemRatings, expectedSuccess, itemRating } from './ratings';
import { MAX_GAP_MS, type SessionAttempt } from './session';

/**
 * The child's learning profile (docs/specs.md, Profil d'apprentissage évolutif): strengths,
 * points to work on and how the child learns, from the answers of the last 30 days as the server
 * stores them. Pure: the server recomputes it after each session and every night.
 */

export const PROFILE_WINDOW_DAYS = 30;

/** Mental calculation is a strength when right answers come this fast, and mostly right. */
export const MENTAL_FAST_MS = 4000;
const MENTAL_MIN_ANSWERS = 20;
const MENTAL_MIN_RATE = 0.75;
/** Right answers in a row that make a « sans-faute » worth saying. */
export const FLAWLESS_RUN = 30;
/** Skills of the child's grade mastered in a strand that make it solid. */
const SOLID_MASTERED = 2;
/** Answers in the window that make a skill's mastery count as practice. */
const PRACTISED_ANSWERS = 10;
/** Without another strength, the best strand of the moment, from this mastery. */
const BEST_MASTERY = 50;

/** A typical mistake is recurrent from 3 times, and for 30 % of the errors on its skills. */
export const RECURRENT_ERROR = 3;
const RECURRENT_SHARE = 0.3;
/** A skill is stuck after 20 answers still under a mastery of 50. */
const STUCK_ANSWERS = 20;
const STUCK_MASTERY = 50;
const MAX_ITEMS = 3;

/**
 * Attention: success compared with what the child's rating predicts, by 5 minutes of the session.
 * The focus fades in the first stretch that falls well below the first one.
 */
const ATTENTION_STRETCH = 5;
const ATTENTION_STRETCHES = 5;
const ATTENTION_MIN_ANSWERS = 100;
const ATTENTION_DROP = 0.12;
const MIN_SESSIONS = 5;
/** Time of day: enough answers in two parts of the day, one clearly better. */
const TIME_MIN_ANSWERS = 100;
const TIME_GAP = 0.06;
/** After an error: an answer this fast is a guess. */
export const RUSHED_MS = 2000;
const MIN_ERRORS = 10;
const RUSHED_SHARE = 0.3;
const GIVE_UP_SESSIONS = 2;
const GIVE_UP_SHARE = 0.25;
/** A session left this long ago without its end is abandoned, not in progress. */
const ABANDONED_AFTER_MS = 86_400_000;
const MIN_TWINS = 5;

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

export type ProfileSessionKind = 'daily' | 'bonus' | 'boss' | 'placement';

export type ProfileAttempt = Pick<
  SessionAttempt,
  | 'generatorId'
  | 'skill'
  | 'difficulty'
  | 'slot'
  | 'twinOf'
  | 'correct'
  | 'timeMs'
  | 'answeredAt'
  | 'learnerElo'
> & {
  /** Typical mistake behind a wrong answer (diagnose.ts), as the server's regrading found it. */
  error: ErrorTypeCode | null;
};

export type ProfileSession = {
  kind: ProfileSessionKind;
  /** The child's grade when it was played (sessions.grade). */
  grade: Grade;
  startedAt: string;
  /** Null: left before its end. */
  completedAt: string | null;
  attempts: readonly ProfileAttempt[];
};

export type ProfileInput = {
  childGrade: Grade;
  mastery: MasteryMap;
  /** Sessions of the window, and the last placement test even if older. */
  sessions: readonly ProfileSession[];
  itemRatings?: ItemRatings;
  /** The family's time zone (IANA), for the time of day. */
  timeZone: string;
  /** ISO date. */
  at: string;
};

export type Strength =
  /** Above the child's grade (placement test, or a later grade's skill mastered). */
  | { kind: 'ahead'; strand: Strand }
  /** Several skills of the year already mastered. */
  | { kind: 'solid'; strand: Strand; mastered: number }
  /** Without any other: the strand where the child does best for now. */
  | { kind: 'best'; strand: Strand }
  | { kind: 'mental_speed'; medianMs: number; rate: number }
  | { kind: 'flawless'; run: number };

export type Weakness =
  | { kind: 'error'; error: ErrorTypeCode; count: number; lastSeenAt: string }
  /** Below the grade in the placement test. */
  | { kind: 'behind'; strand: Strand }
  /** Mastered once, fading since. */
  | { kind: 'fading'; skill: SkillCode; mastery: number }
  | { kind: 'stuck'; skill: SkillCode; mastery: number; answers: number };

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';
export type AfterError = 'perseveres' | 'gives_up' | 'guesses';

export type LearningStyle = {
  /** Null: too few sessions. Steady: success holds through the session (its usual length). */
  attention: { kind: 'steady'; minutes: number } | { kind: 'drops'; after: number } | null;
  bestTime: TimeOfDay | null;
  afterError: AfterError | null;
  /** Share of twin exercises right: how well a correction is understood. */
  twinSuccess: number | null;
};

export type LearnerProfile = {
  grade: Grade;
  /** Answers of the window the profile rests on. */
  answers: number;
  mastered: number;
  inProgress: number;
  strengths: Strength[];
  weaknesses: Weakness[];
  style: LearningStyle;
  computedAt: string;
};

type Timed = ProfileAttempt & {
  session: ProfileSession;
  /** Active minutes into the session. */
  minute: number;
  /** Success minus what the child's rating predicted: tiredness and time of day show here. */
  surprise: number;
};

export function learnerProfile(input: ProfileInput): LearnerProfile {
  const since = Date.parse(input.at) - PROFILE_WINDOW_DAYS * DAY_MS;
  const recent = input.sessions.filter((session) => Date.parse(session.startedAt) >= since);
  const sessions = recent.filter((session) => session.kind !== 'placement');
  const timed = sessions.flatMap((session) => timedAttempts(session, input.itemRatings ?? {}));
  const all = recent.flatMap((session) => session.attempts);
  const placement = lastPlacement(input);

  const records = Object.entries(input.mastery).filter(
    (entry): entry is [SkillCode, NonNullable<(typeof entry)[1]>] =>
      isSkillCode(entry[0]) && entry[1] !== undefined,
  );
  const status = (code: SkillCode) => {
    const record = input.mastery[code];
    return record ? masteryStatus(record, input.at) : 'to_discover';
  };
  const practice = strandPractice(input, all);

  return {
    grade: input.childGrade,
    answers: all.length,
    mastered: records.filter(([code]) => status(code) === 'mastered').length,
    inProgress: records.filter(([code]) => status(code) === 'in_progress').length,
    strengths: strengthsOf(input, timed, placement, status, practice),
    weaknesses: weaknessesOf(input, all, placement, records, practice),
    style: styleOf(input, sessions, timed),
    computedAt: input.at,
  };
}

type Status = (code: SkillCode) => ReturnType<typeof masteryStatus>;
/** Mean mastery of the skills of a strand practised in the window; null when none was. */
type Practice = (strand: Strand) => number | null;

function strandPractice(input: ProfileInput, attempts: readonly ProfileAttempt[]): Practice {
  const answers = new Map<SkillCode, number>();
  for (const { skill } of attempts) answers.set(skill, (answers.get(skill) ?? 0) + 1);
  const levels = new Map<Strand, number[]>();
  for (const [skill, count] of answers) {
    const record = input.mastery[skill];
    if (!record || count < PRACTISED_ANSWERS) continue;
    const { strand } = getSkill(skill);
    levels.set(strand, [...(levels.get(strand) ?? []), masteryOf(record, input.at)]);
  }
  return (strand) => {
    const values = levels.get(strand);
    return values ? mean(values) : null;
  };
}

/** The latest placement test taken in the child's present grade: its result per strand. */
function lastPlacement(input: ProfileInput) {
  const tests = input.sessions
    .filter((s) => s.kind === 'placement' && s.completedAt && s.grade === input.childGrade)
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  const test = tests[0];
  if (!test?.completedAt) return null;
  return placementResult(input.childGrade, test.attempts, test.completedAt);
}

function strengthsOf(
  input: ProfileInput,
  timed: readonly Timed[],
  placement: ReturnType<typeof lastPlacement>,
  status: Status,
  practice: Practice,
): Strength[] {
  const own = gradeRank(input.childGrade);
  // The test's verdict holds unless weeks of practice in the strand say otherwise.
  const ahead = new Set<Strand>(
    placement?.strands
      .filter((s) => s.level === 'ahead' && (practice(s.strand) ?? 100) >= PRESUMED_THRESHOLD)
      .map((s) => s.strand) ?? [],
  );
  const solid = new Map<Strand, number>();
  for (const code of Object.keys(input.mastery).filter(isSkillCode)) {
    if (status(code) !== 'mastered') continue;
    const skill = getSkill(code);
    const rank = gradeRank(skill.grade);
    if (rank > own) ahead.add(skill.strand);
    if (rank === own) solid.set(skill.strand, (solid.get(skill.strand) ?? 0) + 1);
  }
  const strengths: Strength[] = [...ahead]
    .slice(0, 2)
    .map((strand) => ({ kind: 'ahead' as const, strand }));

  const mental = timed.filter((attempt) => getSkill(attempt.skill).automatism);
  const fast = median(mental.filter((a) => a.correct).map((a) => a.timeMs));
  const rate = share(mental, (attempt) => attempt.correct);
  if (mental.length >= MENTAL_MIN_ANSWERS && fast !== null && fast <= MENTAL_FAST_MS) {
    if (rate >= MENTAL_MIN_RATE) strengths.push({ kind: 'mental_speed', medianMs: fast, rate });
  }

  [...solid]
    .filter(([strand, count]) => count >= SOLID_MASTERED && !ahead.has(strand))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .forEach(([strand, mastered]) => strengths.push({ kind: 'solid', strand, mastered }));

  const run = longestRun(timed);
  if (run >= FLAWLESS_RUN) strengths.push({ kind: 'flawless', run });

  if (strengths.length === 0) {
    const [best] = STRANDS.map((strand) => ({ strand, level: practice(strand) ?? 0 }))
      .filter(({ level }) => level >= BEST_MASTERY)
      .sort((a, b) => b.level - a.level);
    if (best) strengths.push({ kind: 'best', strand: best.strand });
  }
  return strengths;
}

function weaknessesOf(
  input: ProfileInput,
  attempts: readonly ProfileAttempt[],
  placement: ReturnType<typeof lastPlacement>,
  records: readonly [SkillCode, NonNullable<MasteryMap[SkillCode]>][],
  practice: Practice,
): Weakness[] {
  const weaknesses: Weakness[] = recurrentErrors(attempts);
  for (const strand of placement?.strands ?? []) {
    if (strand.level === 'to_consolidate' && (practice(strand.strand) ?? 0) < MASTERY_THRESHOLD) {
      weaknesses.push({ kind: 'behind', strand: strand.strand });
    }
  }
  const mastery = (record: (typeof records)[number][1]) => masteryOf(record, input.at);
  records
    .filter(([, record]) => record.masteredAt && masteryStatus(record, input.at) === 'to_review')
    .sort((a, b) => mastery(a[1]) - mastery(b[1]))
    .slice(0, MAX_ITEMS)
    .forEach(([skill, record]) =>
      weaknesses.push({ kind: 'fading', skill, mastery: mastery(record) }),
    );
  const answered = new Map<SkillCode, number>();
  for (const attempt of attempts) {
    answered.set(attempt.skill, (answered.get(attempt.skill) ?? 0) + 1);
  }
  records
    .filter(([skill, record]) => !record.masteredAt && (answered.get(skill) ?? 0) > 0)
    .filter(([, record]) => record.attempts >= STUCK_ANSWERS && mastery(record) < STUCK_MASTERY)
    .sort((a, b) => mastery(a[1]) - mastery(b[1]))
    .slice(0, 2)
    .forEach(([skill, record]) =>
      weaknesses.push({
        kind: 'stuck',
        skill,
        mastery: mastery(record),
        answers: record.attempts,
      }),
    );
  return weaknesses;
}

/** Typical mistakes made 3 times or more, and for a good share of the errors on their skills. */
function recurrentErrors(attempts: readonly ProfileAttempt[]): Weakness[] {
  const found = new Map<ErrorTypeCode, { count: number; lastSeenAt: string }>();
  for (const attempt of attempts) {
    if (attempt.correct || !attempt.error) continue;
    const seen = found.get(attempt.error);
    found.set(attempt.error, {
      count: (seen?.count ?? 0) + 1,
      lastSeenAt:
        seen && seen.lastSeenAt > attempt.answeredAt ? seen.lastSeenAt : attempt.answeredAt,
    });
  }
  return [...found]
    .filter(([error, { count }]) => {
      const skills: readonly string[] = getErrorType(error).skills;
      const errors = attempts.filter((a) => !a.correct && skills.includes(a.skill)).length;
      return count >= RECURRENT_ERROR && count >= RECURRENT_SHARE * errors;
    })
    .sort((a, b) => b[1].count - a[1].count || b[1].lastSeenAt.localeCompare(a[1].lastSeenAt))
    .slice(0, MAX_ITEMS)
    .map(([error, seen]) => ({ kind: 'error', error, ...seen }));
}

function styleOf(
  input: ProfileInput,
  practice: readonly ProfileSession[],
  timed: readonly Timed[],
): LearningStyle {
  return {
    attention: attentionOf(practice, timed),
    bestTime: bestTimeOf(timed, input.timeZone),
    afterError: afterErrorOf(practice, input.at),
    twinSuccess: twinSuccessOf(timed),
  };
}

/** Where success falls below what the child's level predicts, if it does. */
function attentionOf(
  practice: readonly ProfileSession[],
  timed: readonly Timed[],
): LearningStyle['attention'] {
  const completed = timed.filter((attempt) => attempt.session.completedAt);
  const lengths = practice
    .filter((session) => session.completedAt && session.attempts.length > 0)
    .map((session) => activeMinutes(session));
  const minutes = median(lengths);
  if (lengths.length < MIN_SESSIONS || minutes === null) return null;
  const stretches = Array.from({ length: ATTENTION_STRETCHES }, (_, index) =>
    completed
      .filter((attempt) => Math.floor(attempt.minute / ATTENTION_STRETCH) === index)
      .map((attempt) => attempt.surprise),
  );
  const [first = [], ...later] = stretches;
  if (first.length >= ATTENTION_MIN_ANSWERS) {
    const fading = later.findIndex(
      (stretch) =>
        stretch.length >= ATTENTION_MIN_ANSWERS && mean(first) - mean(stretch) >= ATTENTION_DROP,
    );
    if (fading >= 0) return { kind: 'drops', after: (fading + 1) * ATTENTION_STRETCH };
  }
  return { kind: 'steady', minutes: Math.round(minutes) };
}

function bestTimeOf(timed: readonly Timed[], timeZone: string): TimeOfDay | null {
  const parts = new Map<TimeOfDay, number[]>();
  for (const attempt of timed) {
    const part = timeOfDay(localHour(attempt.answeredAt, timeZone));
    parts.set(part, [...(parts.get(part) ?? []), attempt.surprise]);
  }
  const ranked = [...parts]
    .filter(([, surprises]) => surprises.length >= TIME_MIN_ANSWERS)
    .map(([part, surprises]) => ({ part, score: mean(surprises) }))
    .sort((a, b) => b.score - a.score);
  const [best, next] = ranked;
  return best && next && best.score - next.score >= TIME_GAP ? best.part : null;
}

/** What follows an error: a quick guess, the session left, or a new try. */
function afterErrorOf(practice: readonly ProfileSession[], at: string): AfterError | null {
  let errors = 0;
  let rushed = 0;
  for (const session of practice) {
    session.attempts.forEach((attempt, index) => {
      const next = session.attempts[index + 1];
      if (attempt.correct || !next) return;
      errors += 1;
      if (next.timeMs < RUSHED_MS) rushed += 1;
    });
  }
  const left = practice.filter((session) => {
    const last = session.attempts.at(-1);
    return (
      !session.completedAt &&
      last &&
      !last.correct &&
      Date.parse(at) - Date.parse(last.answeredAt) >= ABANDONED_AFTER_MS
    );
  }).length;
  if (errors < MIN_ERRORS) return null;
  if (rushed >= RUSHED_SHARE * errors) return 'guesses';
  if (left >= GIVE_UP_SESSIONS && left >= GIVE_UP_SHARE * practice.length) return 'gives_up';
  return 'perseveres';
}

function twinSuccessOf(timed: readonly Timed[]): number | null {
  const twins = timed.filter((attempt) => attempt.twinOf !== null);
  return twins.length >= MIN_TWINS ? share(twins, (attempt) => attempt.correct) : null;
}

function timedAttempts(session: ProfileSession, ratings: ItemRatings): Timed[] {
  let previous = Date.parse(session.startedAt);
  let active = 0;
  return session.attempts.map((attempt) => {
    const at = Date.parse(attempt.answeredAt);
    active += Math.min(MAX_GAP_MS, Math.max(0, at - previous));
    previous = Math.max(previous, at);
    const item = itemRating(ratings, attempt.generatorId, attempt.difficulty);
    const expected = expectedSuccess(attempt.learnerElo, item);
    return {
      ...attempt,
      session,
      minute: active / MINUTE_MS,
      surprise: (attempt.correct ? 1 : 0) - expected,
    };
  });
}

const activeMinutes = (session: ProfileSession) => timedAttempts(session, {}).at(-1)?.minute ?? 0;

/** Most right answers in a row, within a session. */
function longestRun(timed: readonly Timed[]): number {
  let best = 0;
  let run = 0;
  let session: ProfileSession | null = null;
  for (const attempt of timed) {
    if (attempt.session !== session) run = 0;
    session = attempt.session;
    run = attempt.correct ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/** Hour of the day (0-23) in the family's time zone. */
export function localHour(iso: string, timeZone: string): number {
  let format = formatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-GB', { timeZone, hour: 'numeric', hourCycle: 'h23' });
    formatters.set(timeZone, format);
  }
  const hour = format.formatToParts(new Date(iso)).find((part) => part.type === 'hour');
  return Number(hour?.value ?? 0) % 24;
}

export const timeOfDay = (hour: number): TimeOfDay =>
  hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 17 ? 'afternoon' : 'evening';

const mean = (values: readonly number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? (sorted[middle] ?? 0)
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

const share = <T>(list: readonly T[], test: (item: T) => boolean) =>
  list.length === 0 ? 0 : list.filter(test).length / list.length;
