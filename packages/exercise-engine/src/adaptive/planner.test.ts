import { type SkillCode, getSkill } from '@math-genius/curriculum';
import { GRADES, type Grade, gradeRank } from '@math-genius/shared';

import { generatorId } from '../generator';
import { generators } from '../generators';
import { at } from '../testing/learner';
import {
  type PlannedExercise,
  type PlannerContext,
  buildExercise,
  finishSession,
  planNext,
  practicableSkills,
  recordAttempt,
} from './planner';
import type { SessionAttempt } from './session';

const START = '2026-10-15T17:00:00.000Z';

const contextFor = (overrides: Partial<PlannerContext> = {}): PlannerContext => ({
  childGrade: 'CM1',
  mastery: {},
  itemRatings: {},
  startedAt: START,
  seed: 42,
  ...overrides,
});

/** Plays `count` exercises, answering with `correct(planned, index)`. */
function play(
  context: PlannerContext,
  count: number,
  correct: (planned: PlannedExercise, index: number) => boolean = () => true,
): SessionAttempt[] {
  const attempts: SessionAttempt[] = [];
  for (let i = 0; i < count; i++) {
    const planned = planNext(context, attempts);
    if (!planned) break;
    attempts.push(
      recordAttempt(context, attempts, planned, {
        correct: correct(planned, i),
        hintUsed: false,
        timeMs: 8000,
        answeredAt: at(START, (i + 1) * 20),
      }),
    );
  }
  return attempts;
}

const plannedPart = ({
  generatorId,
  skill,
  difficulty,
  seed,
  slot,
  twinOf,
  reminder,
}: SessionAttempt) =>
  ({ generatorId, skill, difficulty, seed, slot, twinOf, reminder }) satisfies PlannedExercise;

const only = (...skills: SkillCode[]) =>
  generators.filter((generator) => skills.includes(generator.skill));

describe('session planner', () => {
  it('is deterministic and resumes from the answers so far', () => {
    const context = contextFor();
    const attempts = play(context, 40, (_, i) => i % 3 !== 1);
    expect(play(context, 40, (_, i) => i % 3 !== 1)).toEqual(attempts);
    attempts.forEach((attempt, i) => {
      expect(planNext(context, attempts.slice(0, i))).toEqual(plannedPart(attempt));
    });
  });

  it('follows the 40 / 30 / 20 / 10 composition', () => {
    const attempts = play(contextFor({ childGrade: 'CM2' }), 100);
    const share = (slot: string) => attempts.filter((attempt) => attempt.slot === slot).length;
    expect([share('current'), share('review'), share('automatism'), share('challenge')]).toEqual([
      40, 30, 20, 10,
    ]);
  });

  it('keeps the current skills of the grade and reviews earlier ones', () => {
    const attempts = play(contextFor({ childGrade: 'CM2' }), 100);
    const gradesOf = (slot: string) =>
      new Set(attempts.filter((a) => a.slot === slot).map((a) => getSkill(a.skill).grade));
    expect(gradesOf('current')).toEqual(new Set(['CM2']));
    expect([...gradesOf('review')].every((grade) => gradeRank(grade) < gradeRank('CM2'))).toBe(
      true,
    );
    expect(
      attempts.filter((a) => a.slot === 'automatism').every((a) => getSkill(a.skill).automatism),
    ).toBe(true);
  });

  it('reviews the most recent grades first', () => {
    const reviews = play(contextFor({ childGrade: '5e' }), 20)
      .filter((attempt) => attempt.slot === 'review')
      .map((attempt) => getSkill(attempt.skill).grade);
    expect(reviews.slice(0, 3)).toEqual(['6e', '6e', '6e']);
  });

  it('only proposes skills whose prerequisites are acquired', () => {
    const fresh = play(contextFor({ childGrade: 'CE2' }), 200, (_, i) => i % 4 !== 0);
    const skills = new Set(fresh.map((attempt) => attempt.skill));
    expect(skills.has('ce2.doubles-moities')).toBe(true);
    // Tables need the doubles, and written multiplication needs the tables.
    expect(skills.has('ce2.tables-multiplication')).toBe(false);
    expect(skills.has('ce2.multiplication-posee')).toBe(false);

    const doublesMastered = contextFor({
      childGrade: 'CE2',
      mastery: {
        'ce2.doubles-moities': {
          elo: 1500,
          attempts: 30,
          streak: 2,
          masteredAt: '2026-10-14T17:00:00.000Z',
          practicedAt: '2026-10-14T17:00:00.000Z',
        },
      },
    });
    const later = play(doublesMastered, 60);
    expect(later.some((attempt) => attempt.skill === 'ce2.tables-multiplication')).toBe(true);
  });

  it.each(GRADES.filter((grade) => grade !== 'CP' && grade !== 'CE1'))(
    'plans buildable exercises at or below %s',
    (childGrade: Grade) => {
      const attempts = play(contextFor({ childGrade, seed: 7 }), 60, (_, i) => i % 5 !== 2);
      expect(attempts).toHaveLength(60);
      for (const attempt of attempts) {
        expect(gradeRank(getSkill(attempt.skill).grade)).toBeLessThanOrEqual(gradeRank(childGrade));
        const exercise = buildExercise(attempt);
        expect(exercise.skill).toBe(attempt.skill);
        expect(exercise.difficulty).toBe(attempt.difficulty);
      }
    },
  );

  it('has nothing to propose without generators for the grade', () => {
    expect(practicableSkills('CE1')).toEqual([]);
    expect(planNext(contextFor({ childGrade: 'CP' }), [])).toBeNull();
    expect(planNext(contextFor({ generators: [] }), [])).toBeNull();
  });

  it('brings a failed exercise back with new numbers three exercises later', () => {
    const attempts = play(contextFor(), 6, (_, i) => i !== 0);
    const [failed] = attempts;
    const twin = attempts[3];
    expect(twin?.twinOf).toBe(0);
    expect(twin?.generatorId).toBe(failed?.generatorId);
    expect(twin?.difficulty).toBe(failed?.difficulty);
    expect(twin?.seed).not.toBe(failed?.seed);
    expect(attempts.filter((attempt) => attempt.twinOf !== null)).toHaveLength(1);
  });

  it('eases off with a reminder on the same skill after two errors in a row', () => {
    const context = contextFor({ generators: only('cm1.nombres-decimaux', 'cm1.perimetre') });
    const attempts = play(context, 3, (_, i) => i > 1);
    const [, second, third] = attempts;
    expect(third?.reminder).toBe(true);
    expect(third?.skill).toBe(second?.skill);
    expect(third?.difficulty).toBeLessThanOrEqual(Math.max(1, (second?.difficulty ?? 1) - 1));
    expect(attempts.filter((attempt) => attempt.reminder)).toHaveLength(1);
  });

  it('climbs when the child succeeds and comes down when they struggle', () => {
    const context = contextFor({
      childGrade: 'CE2',
      generators: only('ce2.tables-multiplication'),
    });
    const succeeding = play(context, 30).map((attempt) => attempt.difficulty);
    expect(succeeding.at(-1)).toBeGreaterThan(succeeding[0] ?? 5);

    const struggling = play(context, 30, (_, i) => i % 3 === 0).map(
      (attempt) => attempt.difficulty,
    );
    expect(struggling.at(-1)).toBe(1);
  });

  it('counts completed sessions only toward mastery', () => {
    const context = contextFor({ generators: only('cm1.nombres-decimaux') });
    const attempts = play(context, 30);
    const end = attempts.at(-1)?.answeredAt ?? START;
    const completed = finishSession(context, attempts, { at: end, completed: true });
    const abandoned = finishSession(context, attempts, { at: end, completed: false });
    expect(completed['cm1.nombres-decimaux']?.streak).toBe(1);
    expect(abandoned['cm1.nombres-decimaux']?.streak).toBe(0);
    expect(abandoned['cm1.nombres-decimaux']?.attempts).toBe(30);
  });

  it('uses every generator id of the registry', () => {
    const ids = new Set(generators.map(generatorId));
    const attempts = play(contextFor({ childGrade: '5e', seed: 3 }), 300, (_, i) => i % 4 !== 0);
    expect(attempts.every((attempt) => ids.has(attempt.generatorId))).toBe(true);
  });
});
