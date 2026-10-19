import { playSession } from '@/test-utils/play-session';

import { childPractice, openSession, usePracticeStore } from './practice-store';
import { comboOf, practiceStatus, sessionCount, starsOf, summarize } from './summary';

const CHILD = 'child-1';
const today = '2026-10-15';
const open = (hour = 17) =>
  openSession({
    childId: CHILD,
    grade: 'CM1',
    now: new Date(2026, 9, 15, hour),
    id: `s-${hour}`,
    seed: 3,
  });

beforeEach(() => usePracticeStore.setState({ children: {}, itemRatings: {} }));

describe('home status', () => {
  it('offers nothing for grades without exercises yet', () => {
    expect(practiceStatus(undefined, 'CE1', today)).toEqual({ status: 'unavailable' });
  });

  it('goes from ready to in progress to done', () => {
    expect(practiceStatus(childPractice(CHILD), 'CM1', today)).toEqual({ status: 'ready' });
    const session = open();
    expect(practiceStatus(childPractice(CHILD), 'CM1', today)).toEqual({ status: 'ready' });

    playSession(CHILD, session, 15);
    const halfway = practiceStatus(childPractice(CHILD), 'CM1', today);
    expect(halfway).toEqual({ status: 'in-progress', percent: 33 });

    playSession(CHILD, session);
    expect(practiceStatus(childPractice(CHILD), 'CM1', today)).toEqual({ status: 'done' });
    expect(practiceStatus(childPractice(CHILD), 'CM1', '2026-10-16')).toEqual({ status: 'ready' });
  });
});

describe('session summary', () => {
  it('reports the score, the time and the skills that progressed', () => {
    playSession(CHILD, open());
    const session = childPractice(CHILD).lastCompleted;
    if (!session) throw new Error('No session');
    const summary = summarize(session);

    expect(summary.goalMet).toBe(true);
    expect(summary.answered).toBe(session.attempts.length);
    expect(summary.correct).toBe(session.attempts.filter((attempt) => attempt.correct).length);
    expect(summary.minutes).toBe(15);
    expect(summary.progressed.length).toBeGreaterThan(0);
    expect(summary.progressed.length).toBeLessThanOrEqual(3);
    for (const { title, mastery } of summary.progressed) {
      expect(title.length).toBeGreaterThan(0);
      expect(mastery).toBeGreaterThan(0);
      expect(mastery).toBeLessThanOrEqual(100);
    }
  });
});

describe('session header', () => {
  it('counts exercises, or whole minutes of active time', () => {
    expect(sessionCount({ type: 'count', count: 15 }, { answered: 6, activeMs: 200_000 })).toEqual({
      done: 6,
      total: 15,
      unit: 'exercises',
    });
    expect(
      sessionCount({ type: 'duration', minutes: 15 }, { answered: 6, activeMs: 359_000 }),
    ).toEqual({ done: 5, total: 15, unit: 'minutes' });
  });

  it('counts the right answers in a row at the end', () => {
    expect(comboOf([])).toBe(0);
    const right = { correct: true };
    const wrong = { correct: false };
    expect(comboOf([right, right, right])).toBe(3);
    expect(comboOf([right, right, wrong, right, right])).toBe(2);
    expect(comboOf([right, wrong])).toBe(0);
  });
});

describe('stars', () => {
  const summary = {
    kind: 'daily' as const,
    goalMet: true,
    answered: 20,
    minutes: 15,
    progressed: [],
  };
  it('gives up to 3 stars to a validated mission, by its right answers', () => {
    expect(starsOf({ ...summary, correct: 18 })).toBe(3);
    expect(starsOf({ ...summary, correct: 15 })).toBe(2);
    expect(starsOf({ ...summary, correct: 12 })).toBe(1);
    // No stars to count when the mission is not validated: never a reproach.
    expect(starsOf({ ...summary, goalMet: false, correct: 10 })).toBe(0);
  });
});
