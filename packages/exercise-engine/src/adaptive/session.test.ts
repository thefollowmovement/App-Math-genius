import { activeMs, gameCredit, sessionProgress } from './session';

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

describe('mini-games in the daily session', () => {
  // Same case as supabase/tests/database/games.test.sql: a 5-minute round before the session,
  // 4 of its 5 answers slow enough to count.
  const GAME_START = '2026-10-15T16:30:00.000Z';
  const round = {
    startedAt: GAME_START,
    attempts: [60, 120, 180, 240, 300].map((seconds, index) => ({
      answeredAt: new Date(Date.parse(GAME_START) + seconds * 1000).toISOString(),
      timeMs: index === 2 ? 800 : 3000,
    })),
  };
  const games = gameCredit([round]);
  const every30s = (count: number) => Array.from({ length: count }, (_, i) => answer((i + 1) * 30));

  it('measure a round like a session', () => {
    expect(games).toEqual({ activeMs: 300_000, answers: 4 });
  });

  it('count for 30 % of a duration goal at most', () => {
    const goal = { type: 'duration', minutes: 15 } as const;
    const done = sessionProgress(goal, START, every30s(21), games);
    expect(done.fromGames).toBe(270_000);
    expect(done.progress).toBe(1);
    expect(done.goalMet).toBe(true);
    expect(sessionProgress(goal, START, every30s(20), games).goalReached).toBe(false);
    expect(sessionProgress(goal, START, every30s(21)).goalReached).toBe(false);
  });

  it('count for 30 % of a count goal at most', () => {
    const goal = { type: 'count', count: 10 } as const;
    const done = sessionProgress(goal, START, every30s(7), games);
    expect(done.fromGames).toBe(3);
    expect(done.goalReached).toBe(true);
    expect(sessionProgress(goal, START, every30s(6), games).goalReached).toBe(false);
  });
});
