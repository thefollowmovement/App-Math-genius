import { activeMs, sessionProgress } from './session';

const START = '2026-10-15T17:00:00.000Z';
const at = (seconds: number) => new Date(Date.parse(START) + seconds * 1000).toISOString();
const answer = (seconds: number, correct = true, timeMs = 8000) => ({
  answeredAt: at(seconds),
  correct,
  timeMs,
});

describe('session progress', () => {
  // Same case as supabase/tests/database/practice_sessions.test.sql.
  it('counts active time with pauses capped at 2 minutes', () => {
    expect(activeMs(START, [answer(10), answer(25), answer(180), answer(190)])).toBe(155_000);
    expect(activeMs(START, [])).toBe(0);
  });

  it('ignores clock jumps backwards', () => {
    expect(activeMs(START, [answer(30), answer(20), answer(40)])).toBe(40_000);
  });

  it('reaches a duration goal with enough success', () => {
    const attempts = Array.from({ length: 45 }, (_, i) => answer((i + 1) * 20, i % 4 !== 0));
    const progress = sessionProgress({ type: 'duration', minutes: 15 }, START, attempts);
    expect(progress.activeMs).toBe(900_000);
    expect(progress.goalReached).toBe(true);
    expect(progress.successRate).toBeCloseTo(0.733, 2);
    expect(progress.goalMet).toBe(true);
    expect(progress.finished).toBe(true);
  });

  it('keeps going below 60 % until 1.5 times the goal', () => {
    const attempts = (count: number) =>
      Array.from({ length: count }, (_, i) => answer((i + 1) * 20, i % 2 === 0 && i % 4 !== 0));
    const goal = { type: 'duration', minutes: 10 } as const;

    const atGoal = sessionProgress(goal, START, attempts(30));
    expect(atGoal.goalReached).toBe(true);
    expect(atGoal.goalMet).toBe(false);
    expect(atGoal.finished).toBe(false);

    const overtime = sessionProgress(goal, START, attempts(45));
    expect(overtime.goalMet).toBe(false);
    expect(overtime.finished).toBe(true);
  });

  it('does not count answers faster than a child can read toward a count goal', () => {
    const attempts = [...Array(18)].map((_, i) => answer(i * 10 + 10, true, i < 4 ? 500 : 6000));
    const progress = sessionProgress({ type: 'count', count: 20 }, START, attempts);
    expect(progress.progress).toBeCloseTo(14 / 20);
    expect(progress.goalReached).toBe(false);
    expect(progress.flagged).toBe(false);
  });

  it('flags many answers tapped too fast, without stopping the session', () => {
    const attempts = [...Array(12)].map((_, i) =>
      answer(i * 3 + 3, i % 3 === 0, i < 5 ? 600 : 3000),
    );
    const progress = sessionProgress({ type: 'count', count: 20 }, START, attempts);
    expect(progress.flagged).toBe(true);
    expect(progress.finished).toBe(false);
  });
});
