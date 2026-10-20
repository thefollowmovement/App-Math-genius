import {
  STRANDS,
  type Skill,
  type SkillCode,
  type Strand,
  getSkill,
  isSkillCode,
  skills,
} from '@math-genius/curriculum';
import { type Grade, gradeRank } from '@math-genius/shared';

import type { Difficulty } from '../exercise';
import { type Generator, generatorId } from '../generator';
import { generators as allGenerators } from '../generators';
import { createRng, deriveSeed } from '../random';
import {
  type MasteryMap,
  type MasteryRecord,
  PRESUMED_THRESHOLD,
  applyAnswer,
  closeSession,
  masteryOf,
} from './mastery';
import type { PlannedExercise, PlannerContext } from './planner';
import { itemRating } from './ratings';
import type { SessionAttempt } from './session';

/**
 * The placement test (docs/specs.md, Test de positionnement): an adaptive test of 15 to 25
 * questions that places the child area by area (strands of the referential), not only by grade.
 *
 * Each strand is a ladder of rungs, one per grade that has exercises, up to the grade above the
 * child's. The test starts on the child's grade (or the nearest rung below) and climbs after a
 * passed rung, steps down after a failed one, until the level is bracketed. A rung is decided by
 * two answers that agree, or by a third when they do not: one slip never moves a child a grade.
 * Strands take turns, so the test feels varied and every strand gets its first questions early.
 *
 * Like planNext, the next question is a pure function of the context and the answers so far, and
 * the result can be computed again from the stored answers (the parent's view).
 */

/** Questions at most; a test stops earlier once every strand is bracketed. */
export const PLACEMENT_MAX_QUESTIONS = 25;
/** Answers that agree and decide a rung. */
const AGREE = 2;

/**
 * One step of a strand's ladder. Below the child's grade, a rung asks for consolidated skills
 * (difficulty 3); on the child's own grade, for the basics of the year (difficulty 2), which the
 * child may still be learning; above it, for a consolidated level (difficulty 3) that says the
 * child is ahead. `rank` is the grade the rung stands for (gradeRank).
 */
export type Rung = { rank: number; grade: Grade; difficulty: Difficulty; skills: SkillCode[] };

/** Rungs of a strand for a child, lowest first; empty when the test cannot place the strand. */
export function placementRungs(
  strand: Strand,
  childGrade: Grade,
  generators: readonly Generator[] = allGenerators,
): Rung[] {
  const own = gradeRank(childGrade);
  const withGenerator = new Set<string>(generators.map((generator) => generator.skill));
  const byRank = new Map<number, Skill[]>();
  for (const skill of skills) {
    const rank = gradeRank(skill.grade);
    if (skill.strand !== strand || !withGenerator.has(skill.code) || rank > own + 1) continue;
    byRank.set(rank, [...(byRank.get(rank) ?? []), skill]);
  }
  const rungs = [...byRank.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rank, list]): Rung => {
      const grade = list[0]?.grade ?? childGrade;
      const difficulty: Difficulty = rank === own ? 2 : 3;
      const codes = list.map((skill) => skill.code).filter(isSkillCode);
      return { rank, grade, difficulty, skills: codes };
    });
  const lowest = rungs[0];
  // Nothing on the child's grade or below: the strand waits for exercises (géométrie for now).
  if (!lowest || lowest.rank > own) return [];
  // The referential starts at CE2: below a CE2 child's grade, the easiest CE2 exercises stand
  // for the grade before, so that a child who fails the year's basics is still placed.
  if (lowest.rank === own) rungs.unshift({ ...lowest, rank: own - 1, difficulty: 1 });
  return rungs;
}

type Answer = Pick<SessionAttempt, 'skill' | 'difficulty' | 'correct'>;
/** An answer of the test, as the device keeps it or the server stores it. */
export type TestAnswer = Answer & Pick<SessionAttempt, 'generatorId' | 'answeredAt'>;
type Verdict = 'passed' | 'failed' | 'open';

export type StrandState = {
  strand: Strand;
  rungs: Rung[];
  /** Answers given on each rung, in the order of `rungs`. */
  answers: boolean[][];
  /** Rung being tested; null once the strand is bracketed (or cannot be tested). */
  current: number | null;
};

/** The rung an answer was given on: its skill's grade and the difficulty asked. */
const rungOf = (rungs: readonly Rung[], answer: Answer) => {
  const grade = isSkillCode(answer.skill) ? getSkill(answer.skill).grade : null;
  return rungs.findIndex((rung) => rung.grade === grade && rung.difficulty === answer.difficulty);
};

const verdictOf = (answers: readonly boolean[] = []): Verdict => {
  const right = answers.filter(Boolean).length;
  if (right >= AGREE) return 'passed';
  if (answers.length - right >= AGREE) return 'failed';
  return 'open';
};

/** Walks the ladder from the start: up after a pass, down after a failure. */
function currentRung(rungs: readonly Rung[], answers: readonly boolean[][], own: number) {
  if (rungs.length === 0) return null;
  let index = rungs.reduce((start, rung, i) => (rung.rank <= own ? i : start), 0);
  for (;;) {
    const verdict = verdictOf(answers[index]);
    if (verdict === 'open') return index;
    const next = index + (verdict === 'passed' ? 1 : -1);
    const nextVerdict = verdictOf(answers[next]);
    if (next < 0 || next >= rungs.length) return null;
    // Bracketed: a passed rung right under a failed one.
    if (verdict === 'passed' ? nextVerdict === 'failed' : nextVerdict === 'passed') return null;
    index = next;
  }
}

/** Every strand's ladder and where the test stands on it, replayed from the answers. */
export function placementState(
  childGrade: Grade,
  attempts: readonly Answer[],
  generators: readonly Generator[] = allGenerators,
): StrandState[] {
  const own = gradeRank(childGrade);
  return STRANDS.map((strand) => {
    const rungs = placementRungs(strand, childGrade, generators);
    const answers = rungs.map((): boolean[] => []);
    for (const attempt of attempts) {
      if (!isSkillCode(attempt.skill) || getSkill(attempt.skill).strand !== strand) continue;
      answers[rungOf(rungs, attempt)]?.push(attempt.correct);
    }
    return { strand, rungs, answers, current: currentRung(rungs, answers, own) };
  });
}

/** Next question of the test, or null when it is over. */
export function planPlacementExercise(
  context: PlannerContext,
  attempts: readonly SessionAttempt[],
): PlannedExercise | null {
  if (attempts.length >= PLACEMENT_MAX_QUESTIONS) return null;
  const generators = context.generators ?? allGenerators;
  const states = placementState(context.childGrade, attempts, generators);
  const asked = (state: StrandState) => state.answers.flat().length;
  // Strands take turns: the one with the fewest answers, from a seeded first strand.
  const first = createRng(context.seed).int(0, STRANDS.length - 1);
  const turn = (state: StrandState) =>
    (STRANDS.indexOf(state.strand) - first + STRANDS.length) % STRANDS.length;
  const state = states
    .filter((candidate) => candidate.current !== null)
    .sort((a, b) => asked(a) - asked(b) || turn(a) - turn(b))[0];
  if (!state || state.current === null) return null;
  const rung = state.rungs[state.current];
  if (!rung) return null;

  // The rung's skills take turns too, from a seeded start, so a rung asks different skills.
  const rng = createRng(deriveSeed(context.seed, attempts.length));
  const start = createRng(deriveSeed(context.seed, 1000 + rung.rank)).int(0, 99);
  const done = state.answers[state.current]?.length ?? 0;
  const skill = rung.skills[(start + done) % rung.skills.length];
  const candidates = generators.filter((generator) => generator.skill === skill);
  if (!skill || candidates.length === 0) return null;
  return {
    generatorId: generatorId(rng.pick(candidates)),
    skill,
    difficulty: rung.difficulty,
    seed: rng.int(0, 2 ** 31 - 1),
    slot: 'current',
    twinOf: null,
    reminder: false,
  };
}

/** How far the test is, for its progress bar (no score, no timer: docs/specs.md). */
export function placementProgress(childGrade: Grade, attempts: readonly Answer[]): number {
  if (attempts.length >= PLACEMENT_MAX_QUESTIONS) return 1;
  const tested = placementState(childGrade, attempts).filter((state) => state.rungs.length > 0);
  if (tested.length === 0) return 1;
  const share = (state: StrandState) =>
    state.current === null ? 1 : Math.min(0.75, state.answers.flat().length / 4);
  return tested.reduce((sum, state) => sum + share(state), 0) / tested.length;
}

/** Where the child stands in a strand, against the expectations of the grade. */
export type StrandLevel = 'ahead' | 'on_track' | 'to_consolidate';

export type StrandResult = {
  strand: Strand;
  /** Null: no exercise yet for this strand (géométrie for now), or no answer in it. */
  level: StrandLevel | null;
  /** Grade rank of the highest rung passed (one below the lowest rung if none was). */
  placedRank: number | null;
  answered: number;
};

export type PlacementResult = {
  strands: StrandResult[];
  /** The three skills to work on first, most basic first (docs/specs.md, Résultat parent). */
  priorities: SkillCode[];
};

/**
 * Ahead: passed a rung above the grade. On track: passed the year's basics, or the grade below,
 * which the year builds on (early in the year, the year's own skills are still being taught).
 * To consolidate: below that.
 */
function levelOf(placedRank: number, own: number): StrandLevel {
  if (placedRank > own) return 'ahead';
  return placedRank >= own - 1 ? 'on_track' : 'to_consolidate';
}

function strandResult(state: StrandState, own: number): StrandResult {
  const answered = state.answers.flat().length;
  if (state.rungs.length === 0 || answered === 0) {
    return { strand: state.strand, level: null, placedRank: null, answered };
  }
  const verdicts = state.answers.map(verdictOf);
  const passed = state.rungs.filter((_, i) => verdicts[i] === 'passed').map((rung) => rung.rank);
  const failed = state.rungs.filter((_, i) => verdicts[i] === 'failed').map((rung) => rung.rank);
  // Without a passed rung, the child is placed just under the lowest failed one (or the start).
  const start = state.rungs.reduce((rank, rung) => (rung.rank <= own ? rung.rank : rank), 0);
  const placedRank = passed.length > 0 ? Math.max(...passed) : Math.min(start, ...failed) - 1;
  return { strand: state.strand, level: levelOf(placedRank, own), placedRank, answered };
}

/** Answers of the test on each skill: right and wrong. */
function skillTallies(attempts: readonly Answer[]) {
  const tallies = new Map<SkillCode, { right: number; wrong: number }>();
  for (const { skill, correct } of attempts) {
    const tally = tallies.get(skill) ?? { right: 0, wrong: 0 };
    tallies.set(
      skill,
      correct ? { ...tally, right: tally.right + 1 } : { ...tally, wrong: tally.wrong + 1 },
    );
  }
  return tallies;
}

/** Every skill a skill requires, directly or not. */
function prerequisitesOf(code: SkillCode, into = new Set<SkillCode>()): Set<SkillCode> {
  for (const prerequisite of getSkill(code).prerequisites) {
    if (!isSkillCode(prerequisite) || into.has(prerequisite)) continue;
    into.add(prerequisite);
    prerequisitesOf(prerequisite, into);
  }
  return into;
}

/** Prerequisites of an earlier grade than the skill itself. */
const earlierPrerequisites = (code: SkillCode) => {
  const rank = gradeRank(getSkill(code).grade);
  return [...prerequisitesOf(code)].filter((other) => gradeRank(getSkill(other).grade) < rank);
};

/** Starting ratings once placed: acquired up to the placed grade, then one grade at a time. */
export const PLACED_ELO = { acquired: 1450, next: 1150, beyond: 950 } as const;

/** What the test concludes, skill by skill: the records it writes and its result. */
function conclude(
  context: Pick<PlannerContext, 'childGrade' | 'mastery' | 'itemRatings' | 'generators'>,
  attempts: readonly TestAnswer[],
  at: string,
) {
  const { childGrade } = context;
  const own = gradeRank(childGrade);
  const generators = context.generators ?? allGenerators;
  const states = placementState(childGrade, attempts, generators);
  const results = states.map((state) => strandResult(state, own));
  const placedRank = new Map(results.map((result) => [result.strand, result.placedRank]));
  const tallies = skillTallies(attempts);
  const failed = (code: SkillCode) => {
    const tally = tallies.get(code);
    return tally !== undefined && tally.wrong > tally.right;
  };
  const right = (code: SkillCode) => {
    const tally = tallies.get(code);
    return tally !== undefined && tally.right > tally.wrong;
  };
  // A skill passed at a higher level marks what it requires from earlier grades as acquired
  // (docs/specs.md): passing CM2 fractions says the CM1 and CE2 fractions are known.
  const required = new Set<SkillCode>();
  for (const [code] of tallies) {
    const skill = getSkill(code);
    const placed = placedRank.get(skill.strand) ?? null;
    if (right(code) && placed !== null && gradeRank(skill.grade) <= placed) {
      for (const prerequisite of earlierPrerequisites(code)) required.add(prerequisite);
    }
  }

  const withGenerator = new Set<string>(generators.map((generator) => generator.skill));
  const mastery: Partial<Record<SkillCode, MasteryRecord>> = { ...context.mastery };
  const acquired = new Set<SkillCode>();
  for (const skill of skills) {
    if (!isSkillCode(skill.code)) continue;
    const code = skill.code;
    const rank = gradeRank(skill.grade);
    const placed = placedRank.get(skill.strand) ?? null;
    const tested = tallies.has(code);
    if (!withGenerator.has(code) || (rank > own && !tested) || (placed === null && !tested)) {
      continue;
    }
    // Practice says more than the test's guess: a practised skill keeps its rating.
    const existing = context.mastery[code];
    const practised = existing !== undefined && existing.attempts > 0;
    const guess =
      placed === null || rank <= placed
        ? PLACED_ELO.acquired
        : rank === placed + 1
          ? PLACED_ELO.next
          : PLACED_ELO.beyond;
    let record: MasteryRecord =
      practised && existing
        ? existing
        : {
            elo: guess,
            attempts: 0,
            streak: 0,
            masteredAt: existing?.masteredAt ?? null,
            practicedAt: null,
          };
    for (const attempt of attempts.filter((candidate) => candidate.skill === code)) {
      record = applyAnswer(record, {
        item: itemRating(context.itemRatings, attempt.generatorId, attempt.difficulty),
        correct: attempt.correct,
        at: attempt.answeredAt,
      });
    }
    if (tested) record = closeSession(record, at);

    // Acquired: required by a skill passed higher up, or an earlier grade's skill under the
    // level the strand reached. The year's own skills stay to be confirmed by practice.
    const known =
      !failed(code) &&
      rank <= own &&
      (required.has(code) ||
        (placed !== null &&
          rank < own &&
          rank <= placed &&
          masteryOf(record, at) >= PRESUMED_THRESHOLD));
    if (known) {
      record = {
        ...record,
        elo: Math.max(record.elo, PLACED_ELO.acquired),
        masteredAt: record.masteredAt ?? at,
      };
    }
    if (record.masteredAt) acquired.add(code);
    mastery[code] = record;
  }
  return { results, mastery, acquired, failed, own };
}

/** The records a finished test leaves: every skill the child can practise gets one. */
export function placementMastery(
  context: Pick<PlannerContext, 'childGrade' | 'mastery' | 'itemRatings' | 'generators'>,
  attempts: readonly TestAnswer[],
  at: string,
): MasteryMap {
  return conclude(context, attempts, at).mastery;
}

/**
 * The test's result: a level per strand and three priorities. First the skills failed in the
 * test, most basic first and from different strands, then the next skills to learn.
 */
export function placementResult(
  childGrade: Grade,
  attempts: readonly TestAnswer[],
  at: string,
  generators: readonly Generator[] = allGenerators,
): PlacementResult {
  const { results, mastery, acquired, failed, own } = conclude(
    { childGrade, mastery: {}, itemRatings: {}, generators },
    attempts,
    at,
  );
  const open = (code: SkillCode) =>
    getSkill(code).prerequisites.every(
      (prerequisite) =>
        !isSkillCode(prerequisite) || !(prerequisite in mastery) || acquired.has(prerequisite),
    );
  const score = (code: SkillCode) => {
    const record = mastery[code];
    return record ? masteryOf(record, at) : 0;
  };
  const candidates = skills
    .map((skill) => skill.code)
    .filter(isSkillCode)
    .filter((code) => code in mastery && !acquired.has(code))
    .filter((code) => gradeRank(getSkill(code).grade) <= own && (failed(code) || open(code)))
    .sort(
      (a, b) =>
        Number(failed(b)) - Number(failed(a)) ||
        gradeRank(getSkill(a).grade) - gradeRank(getSkill(b).grade) ||
        score(a) - score(b),
    );
  // Different strands first, then whatever is left.
  const priorities: SkillCode[] = [];
  for (const code of candidates) {
    const strand = getSkill(code).strand;
    if (priorities.length < 3 && !priorities.some((other) => getSkill(other).strand === strand)) {
      priorities.push(code);
    }
  }
  for (const code of candidates) {
    if (priorities.length < 3 && !priorities.includes(code)) priorities.push(code);
  }
  return { strands: results, priorities };
}

/** Days after which a new, shorter test checks the placement again (docs/specs.md). */
export const PLACEMENT_RECHECK_DAYS = 91;

/**
 * Whether the child should take the test: never taken, taken more than three months ago, or
 * before this school year's start (1 September, when the child moves up a grade).
 */
export function placementDue(lastPlacedAt: string | null, now: Date): boolean {
  if (!lastPlacedAt) return true;
  const last = Date.parse(lastPlacedAt);
  if (now.getTime() - last >= PLACEMENT_RECHECK_DAYS * 86_400_000) return true;
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return last < new Date(year, 8, 1).getTime();
}
