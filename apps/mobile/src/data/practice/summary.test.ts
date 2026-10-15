import { playSession } from '@/test-utils/play-session';

import { childPractice, openSession, usePracticeStore } from './practice-store';
import { practiceStatus, summarize } from './summary';

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
