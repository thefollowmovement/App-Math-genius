import { getSkill } from '@math-genius/curriculum';
import type { Grade } from '@math-genius/shared';

import { at, simulateSession, type Learner } from '../testing/learner';
import { type MasteryMap, masteryStatus } from './mastery';
import type { PlannerContext } from './planner';
import type { SessionAttempt } from './session';

const FIRST_DAY = '2026-10-05T17:00:00.000Z';

/** Six daily 15-minute sessions, mastery carried from one to the next. */
function simulateWeek(childGrade: Grade, learner: Learner, seed = 1) {
  let mastery: MasteryMap = {};
  const sessions: SessionAttempt[][] = [];
  for (let day = 0; day < 6; day++) {
    const context: PlannerContext = {
      childGrade,
      mastery,
      itemRatings: {},
      startedAt: at(FIRST_DAY, day * 86_400),
      seed: seed * 100 + day,
    };
    const result = simulateSession(context, learner);
    sessions.push(result.attempts);
    mastery = result.mastery;
  }
  return { sessions, mastery };
}

const successRate = (attempts: SessionAttempt[]) =>
  attempts.filter((attempt) => attempt.correct).length / attempts.length;

describe('simulated learners', () => {
  // Level on the skills of the child's grade; earlier grades are better known. Above 1700,
  // difficulty 5 is too easy and success climbs past 85 %: harder generators will fix that.
  it.each([1100, 1300, 1500, 1600])(
    'keeps a child of level %i around 75–85 % success once calibrated',
    (level) => {
      for (const childGrade of ['CE2', 'CM1', '6e'] as const) {
        const learner: Learner = (skill) =>
          level + (getSkill(skill).grade === childGrade ? 0 : 200);
        const { sessions } = simulateWeek(childGrade, learner, level);
        const calibrated = successRate(sessions.slice(1).flat());
        expect(calibrated).toBeGreaterThan(0.72);
        expect(calibrated).toBeLessThan(0.88);
      }
    },
  );

  it('fills a 15-minute session with about 45 exercises', () => {
    const { sessions } = simulateWeek('CM2', () => 1400);
    for (const attempts of sessions) {
      expect(attempts.length).toBeGreaterThanOrEqual(45);
      expect(attempts.length).toBeLessThanOrEqual(68);
    }
  });

  it('lets a strong child master skills and move on to new ones', () => {
    const { sessions, mastery } = simulateWeek('CM1', () => 1750);
    const lastDay = at(FIRST_DAY, 5 * 86_400);
    const mastered = Object.values(mastery).filter(
      (record) => record && masteryStatus(record, lastDay) === 'mastered',
    );
    expect(mastered.length).toBeGreaterThanOrEqual(2);

    const currentSkills = (attempts: SessionAttempt[]) =>
      new Set(attempts.filter((a) => a.slot === 'current').map((a) => a.skill));
    const first = currentSkills(sessions[0] ?? []);
    const last = currentSkills(sessions.at(-1) ?? []);
    expect([...last].some((skill) => !first.has(skill))).toBe(true);
  });

  it('keeps a struggling child on easy exercises', () => {
    const { sessions } = simulateWeek('CM1', () => 1000);
    const last = sessions.at(-1) ?? [];
    const average = last.reduce((sum, attempt) => sum + attempt.difficulty, 0) / last.length;
    expect(average).toBeLessThan(2);
  });

  it('adapts per skill: a weak skill gets easier exercises than a strong one', () => {
    const learner: Learner = (skill) => (skill === 'ce2.tables-multiplication' ? 1050 : 1600);
    const { sessions } = simulateWeek('CM1', learner, 9);
    const last = sessions.slice(3).flat();
    const averageOn = (weak: boolean) => {
      const subset = last.filter(
        (attempt) => (attempt.skill === 'ce2.tables-multiplication') === weak,
      );
      return subset.reduce((sum, attempt) => sum + attempt.difficulty, 0) / subset.length;
    };
    expect(averageOn(true)).toBeLessThan(averageOn(false) - 1);
  });
});
