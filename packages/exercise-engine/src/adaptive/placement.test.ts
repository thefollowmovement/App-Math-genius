import { STRANDS, type SkillCode, type Strand, getSkill } from '@math-genius/curriculum';
import { type Grade, gradeRank } from '@math-genius/shared';

import { at, simulatePlacement, type Learner } from '../testing/learner';
import { type MasteryMap, masteryOf, masteryStatus } from './mastery';
import {
  PLACEMENT_MAX_QUESTIONS,
  placementDue,
  placementProgress,
  placementResult,
  placementRungs,
  placementState,
} from './placement';
import {
  type PlannedExercise,
  type PlannerContext,
  finishSession,
  planNext,
  recordAttempt,
} from './planner';
import { worldMap } from './islands';
import type { SessionAttempt } from './session';

const START = '2026-10-20T17:00:00.000Z';

const contextFor = (childGrade: Grade, seed = 1, mastery: MasteryMap = {}): PlannerContext => ({
  childGrade,
  mastery,
  itemRatings: {},
  startedAt: START,
  seed,
  placement: true,
});

/** Plays a whole test with scripted answers. */
function play(
  childGrade: Grade,
  answer: (planned: PlannedExercise, index: number) => boolean,
  seed = 1,
) {
  const context = contextFor(childGrade, seed);
  const attempts: SessionAttempt[] = [];
  for (;;) {
    const planned = planNext(context, attempts);
    if (!planned) break;
    attempts.push(
      recordAttempt(context, attempts, planned, {
        correct: answer(planned, attempts.length),
        hintUsed: false,
        timeMs: 10_000,
        answeredAt: at(START, (attempts.length + 1) * 25),
      }),
    );
  }
  return { context, attempts, end: attempts.at(-1)?.answeredAt ?? START };
}

const strandOf = (skill: SkillCode) => getSkill(skill).strand;
const rankOf = (skill: SkillCode) => gradeRank(getSkill(skill).grade);
const levels = (childGrade: Grade, attempts: SessionAttempt[]) =>
  Object.fromEntries(
    placementResult(childGrade, attempts, START).strands.map((result) => [
      result.strand,
      result.level,
    ]),
  );

describe('placement ladders', () => {
  it('climbs from the grades below to the grade above, harder below and above the grade', () => {
    expect(
      placementRungs('fractions', 'CM1').map(({ grade, difficulty }) => [grade, difficulty]),
    ).toEqual([
      ['CE2', 3],
      ['CM1', 2],
      ['CM2', 3],
    ]);
  });

  it('stands for the grade before CE2 with the easiest CE2 exercises', () => {
    const rungs = placementRungs('calcul', 'CE2');
    expect(rungs.map(({ grade, difficulty }) => [grade, difficulty])).toEqual([
      ['CE2', 1],
      ['CE2', 2],
      ['CM1', 3],
    ]);
    expect(rungs[0]?.rank).toBe(gradeRank('CE1'));
  });

  it('leaves out a strand without exercises on the grade or below', () => {
    expect(placementRungs('geometrie', 'CM2')).toEqual([]);
    expect(placementRungs('problemes', 'CE2')).toEqual([]);
  });
});

describe('placement test', () => {
  it('lets every strand ask once before any strand asks twice', () => {
    const { attempts } = play('CM1', () => true);
    const tested = STRANDS.filter((strand) => placementRungs(strand, 'CM1').length > 0);
    expect(new Set(attempts.slice(0, tested.length).map((a) => strandOf(a.skill)))).toEqual(
      new Set(tested),
    );
  });

  it('starts every strand on the grade, at the basics of the year', () => {
    const { attempts } = play('CM2', () => true);
    const first = new Map<Strand, SessionAttempt>();
    for (const attempt of attempts) {
      if (!first.has(strandOf(attempt.skill))) first.set(strandOf(attempt.skill), attempt);
    }
    for (const attempt of first.values()) {
      expect(getSkill(attempt.skill).grade).toBe('CM2');
      expect(attempt.difficulty).toBe(2);
    }
  });

  it('climbs after two right answers and stops once the grade above is passed', () => {
    const { attempts } = play('CM1', () => true);
    // Two answers on CM1, two on CM2, in each of the five strands with exercises.
    expect(attempts).toHaveLength(20);
    expect(levels('CM1', attempts)).toEqual({
      numeration: 'ahead',
      calcul: 'ahead',
      fractions: 'ahead',
      mesures: 'ahead',
      geometrie: null,
      problemes: 'ahead',
    });
  });

  it('steps down after two errors until a level is passed', () => {
    // Knows CE2, nothing of CM1 or CM2.
    const { attempts } = play('CM2', (planned) => rankOf(planned.skill) <= gradeRank('CE2'));
    const fractions = attempts.filter((a) => strandOf(a.skill) === 'fractions');
    // The 25th question comes before the second CE2 one: the failed rungs place the child.
    expect(attempts).toHaveLength(PLACEMENT_MAX_QUESTIONS);
    expect(fractions.map((a) => getSkill(a.skill).grade)).toEqual([
      'CM2',
      'CM2',
      'CM1',
      'CM1',
      'CE2',
    ]);
    expect(placementResult('CM2', attempts, START).strands[2]).toMatchObject({
      strand: 'fractions',
      level: 'to_consolidate',
      placedRank: gradeRank('CE2'),
    });
  });

  it('does not move a child for one slip: a third question decides', () => {
    // One error on the first CM1 answer of each strand, everything else right.
    const seen = new Set<Strand>();
    const { attempts } = play('CM1', (planned) => {
      const strand = strandOf(planned.skill);
      if (seen.has(strand)) return true;
      seen.add(strand);
      return false;
    });
    const fractions = attempts.filter((a) => strandOf(a.skill) === 'fractions');
    expect(fractions.map((a) => [getSkill(a.skill).grade, a.correct])).toEqual([
      ['CM1', false],
      ['CM1', true],
      ['CM1', true],
      ['CM2', true],
      ['CM2', true],
    ]);
  });

  it('is a pure function of the answers so far', () => {
    const { context, attempts } = play('6e', (_, index) => index % 3 !== 0, 42);
    for (let count = 0; count < attempts.length; count++) {
      const again = planNext(context, attempts.slice(0, count));
      expect(again).toMatchObject({
        skill: attempts[count]?.skill,
        generatorId: attempts[count]?.generatorId,
        difficulty: attempts[count]?.difficulty,
        seed: attempts[count]?.seed,
      });
    }
  });

  it('never asks more than the maximum, even when answers keep the level open', () => {
    // Alternating answers leave every rung open as long as possible.
    for (const grade of ['CE2', 'CM1', 'CM2', '6e', '5e'] as const) {
      const { attempts } = play(grade, (_, index) => index % 2 === 0, 3);
      expect(attempts.length).toBeLessThanOrEqual(PLACEMENT_MAX_QUESTIONS);
    }
  });

  it('shows its progress without a score, finished at the end', () => {
    const { attempts } = play('CM1', (_, index) => index % 4 !== 1);
    const steps = attempts.map((_, count) => placementProgress('CM1', attempts.slice(0, count)));
    expect(steps[0]).toBe(0);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]).toBeGreaterThanOrEqual((steps[i - 1] ?? 0) - 0.05);
    }
    expect(placementProgress('CM1', attempts)).toBe(1);
  });

  it('replays the state of each strand from the stored answers', () => {
    const { attempts } = play('CM1', () => true);
    expect(placementState('CM1', attempts).every((state) => state.current === null)).toBe(true);
    expect(
      placementState('CM1', attempts.slice(0, 5)).filter((s) => s.current !== null),
    ).toHaveLength(5);
  });
});

describe('what the test concludes', () => {
  // Knows everything below CM1, half of CM1 (right on numeration and calculation only).
  const { context, attempts, end } = play('CM1', (planned) => {
    const rank = rankOf(planned.skill);
    if (rank < gradeRank('CM1')) return true;
    if (rank > gradeRank('CM1')) return false;
    return ['numeration', 'calcul'].includes(strandOf(planned.skill));
  });
  // A completed test writes what it concludes (placementMastery).
  const mastery = finishSession(context, attempts, { at: end, completed: true });

  it('writes a record for every skill the child can practise', () => {
    for (const code of [
      'ce2.addition-posee',
      'ce2.doubles-moities',
      'ce2.fractions-unitaires',
      'cm1.perimetre',
      'cm1.comparer-decimaux',
    ] as const) {
      expect(mastery[code]).toBeDefined();
    }
  });

  it('marks the earlier grades acquired under the level reached, never the failed skills', () => {
    expect(mastery['ce2.fractions-unitaires']?.masteredAt).toBe(end);
    expect(mastery['ce2.longueurs-conversions']?.masteredAt).toBe(end);
    expect(masteryStatus(mastery['ce2.addition-posee'] ?? fail(), end)).toBe('mastered');
  });

  it('keeps the year’s own skills to confirm, rated by the test', () => {
    const passed = mastery['cm1.nombres-decimaux'];
    const failed = mastery['cm1.fractions-droite-graduee'];
    expect(passed?.masteredAt).toBeNull();
    expect(failed?.masteredAt).toBeNull();
    expect(masteryOf(passed ?? fail(), end)).toBeGreaterThan(masteryOf(failed ?? fail(), end) + 20);
  });

  it('places each strand and picks failed skills of different strands as priorities', () => {
    const result = placementResult('CM1', attempts, end);
    expect(Object.fromEntries(result.strands.map((s) => [s.strand, s.level]))).toEqual({
      numeration: 'on_track',
      calcul: 'on_track',
      // Failed on CM1, passed on CE2: the year builds on what is known.
      fractions: 'on_track',
      mesures: 'on_track',
      geometrie: null,
      // Failed even the easiest exercises.
      problemes: 'to_consolidate',
    });
    expect(result.priorities).toHaveLength(3);
    expect(result.priorities).toContain('cm1.fractions-droite-graduee');
  });
});

function fail(): never {
  throw new Error('missing record');
}

describe('acquisition by prerequisites', () => {
  it('marks what a skill passed a grade higher requires as acquired', () => {
    const { context, attempts, end } = play(
      'CM1',
      (planned) => strandOf(planned.skill) !== 'calcul',
    );
    const mastery = finishSession(context, attempts, { at: end, completed: true });
    // CM2 pourcentages (passed, ahead) requires CM1 proportionnalité.
    expect(mastery['cm1.proportionnalite']?.masteredAt).toBe(end);
    // Calculation failed on CM1 and CE2: no inference reaches the failed skills.
    for (const attempt of attempts.filter((a) => strandOf(a.skill) === 'calcul')) {
      expect(mastery[attempt.skill]?.masteredAt).toBeNull();
    }
  });
});

describe('after the test', () => {
  it('works on the gaps first: earlier grades are no longer presumed known', () => {
    // Knows everything up to CM1 but the fractions, even the CE2 ones.
    const { context, attempts, end } = play(
      'CM1',
      (planned) =>
        strandOf(planned.skill) !== 'fractions' && rankOf(planned.skill) <= gradeRank('CM1'),
    );
    const mastery = finishSession(context, attempts, { at: end, completed: true });
    const daily = (placed: boolean): PlannerContext => ({
      childGrade: 'CM1',
      mastery,
      itemRatings: {},
      startedAt: at(START, 86_400),
      seed: 9,
      placed,
    });
    expect(planNext(daily(true), [])).toMatchObject({
      slot: 'current',
      skill: 'ce2.fractions-unitaires',
    });
    // Without the test, two errors are too few to doubt a CE2 skill.
    expect(planNext(daily(false), [])?.skill).not.toBe('ce2.fractions-unitaires');
  });

  it('shows the skills found acquired on the world map', () => {
    const { context, attempts, end } = play('CM1', () => true);
    const mastery = finishSession(context, attempts, { at: end, completed: true });
    const islands = worldMap({ grade: 'CM1', mastery, at: end, defeated: [], placed: true });
    const node = islands
      .flatMap((island) => island.skills)
      .find((candidate) => candidate.code === 'cm1.nombres-decimaux');
    // Required by the CM2 skills passed: acquired, and shown so before any practice.
    expect(node).toMatchObject({ status: 'mastered' });
    expect(node?.mastery).toBeGreaterThanOrEqual(80);
  });
});

describe('when the test is due', () => {
  const now = new Date(2026, 10, 20);
  it('is due the first time, three months later and at the start of each school year', () => {
    expect(placementDue(null, now)).toBe(true);
    expect(placementDue(new Date(2026, 9, 1).toISOString(), now)).toBe(false);
    expect(placementDue(new Date(2026, 7, 10).toISOString(), now)).toBe(true);
    expect(placementDue(new Date(2026, 1, 1).toISOString(), new Date(2026, 3, 20))).toBe(false);
    expect(placementDue(new Date(2026, 1, 1).toISOString(), new Date(2026, 4, 5))).toBe(true);
  });
});

/**
 * Validation criterion of phase 7 (docs/specs.md): a coherent result for three simulated pupils.
 * A pupil's true level on each skill decides its answers; over 200 tests, the result must say
 * what the profile is, strand by strand and in its priorities.
 */
describe('three simulated pupils', () => {
  const runs = (grade: Grade, learner: Learner) =>
    Array.from({ length: 200 }, (_, seed) =>
      simulatePlacement(contextFor(grade, seed + 1), learner),
    );
  const share = (outcomes: boolean[]) => outcomes.filter(Boolean).length / outcomes.length;
  const levelOf = (run: ReturnType<typeof simulatePlacement>, strand: Strand) =>
    run.result.strands.find((result) => result.strand === strand)?.level;
  const byGrade =
    (grade: Grade, below: number, own: number, above: number) => (skill: SkillCode) => {
      const order = rankOf(skill) - gradeRank(grade);
      return order < 0 ? below : order === 0 ? own : above;
    };
  const tested = (grade: Grade) =>
    STRANDS.filter((strand) => placementRungs(strand, grade).length > 0);

  it('Léa, CM1, ahead: ahead in every strand, 15 to 25 questions', () => {
    const all = runs('CM1', byGrade('CM1', 1750, 1600, 1450));
    for (const strand of tested('CM1')) {
      expect(share(all.map((run) => levelOf(run, strand) === 'ahead'))).toBeGreaterThan(0.8);
    }
    for (const run of all) {
      expect(run.attempts.length).toBeGreaterThanOrEqual(15);
      expect(run.attempts.length).toBeLessThanOrEqual(25);
    }
  });

  it('Tom, CM1, on track but weak in fractions: fractions to consolidate and first priority', () => {
    const level = byGrade('CM1', 1550, 1300, 900);
    const all = runs('CM1', (skill) => (strandOf(skill) === 'fractions' ? 750 : level(skill)));
    expect(share(all.map((run) => levelOf(run, 'fractions') === 'to_consolidate'))).toBeGreaterThan(
      0.8,
    );
    for (const strand of tested('CM1').filter((other) => other !== 'fractions')) {
      expect(share(all.map((run) => levelOf(run, strand) === 'on_track'))).toBeGreaterThan(0.85);
    }
    expect(
      share(
        all.map((run) => strandOf(run.result.priorities[0] ?? 'cm1.perimetre') === 'fractions'),
      ),
    ).toBeGreaterThan(0.8);
  });

  it('Sami, CM2, struggling since CM1: mostly to consolidate, priorities from earlier grades', () => {
    const all = runs('CM2', byGrade('CM2', 950, 800, 650));
    const consolidate = (run: ReturnType<typeof simulatePlacement>) =>
      tested('CM2').filter((strand) => levelOf(run, strand) === 'to_consolidate').length;
    expect(share(all.map((run) => consolidate(run) >= 3))).toBeGreaterThan(0.85);
    expect(
      share(
        all.map((run) => run.result.priorities.every((code) => rankOf(code) < gradeRank('CM2'))),
      ),
    ).toBeGreaterThan(0.8);
    for (const run of all) expect(run.attempts.length).toBeLessThanOrEqual(25);
  });
});
