import { act, renderHook } from '@testing-library/react-native';

import { childPractice, creditOfDay, usePracticeStore } from '@/data/practice/practice-store';
import { bubblesRules } from '@/games/bubbles/rules';
import { fishingRules } from '@/games/fishing/rules';
import { flightRules } from '@/games/flight/rules';
import { gemRainRules } from '@/games/gem-rain/rules';
import { memoryRules } from '@/games/memory/rules';
import type { GameRules } from '@/games/round';

import { useGameRound } from './use-game-round';

jest.mock('@/data/practice/sync', () => ({ syncNow: jest.fn(() => Promise.resolve()) }));

const CHILD = 'child-1';

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 21, 17) });
  usePracticeStore.setState({ children: {}, itemRatings: {} });
});

afterEach(() => jest.useRealTimers());

async function playRound(rules: GameRules, bestScore: number | null = null) {
  const hook = await renderHook(() =>
    useGameRound({ childId: CHILD, grade: 'CM1', rules, bestScore }),
  );
  await act(async () => hook.result.current.start(90));
  return hook;
}

describe('useGameRound', () => {
  it('asks a question of the engine and records each pick, graded by the engine', async () => {
    const { result } = await playRound(fishingRules);
    expect(result.current.phase).toBe('playing');
    const feed = result.current.feed.get();
    expect(feed.key).toBe(1);
    expect(feed.labels).toHaveLength(3);
    expect(result.current.prompt).toBe(feed.prompt);
    expect(childPractice(CHILD).round?.kind).toBe('game');

    // Every label is tried: one of them is the right one.
    for (let index = 0; index < 3; index++) {
      await act(async () => result.current.onEvent({ type: 'choice', key: 1, index }));
      if (result.current.round.right === 1) break;
    }
    const attempts = childPractice(CHILD).round?.attempts ?? [];
    expect(attempts.length).toBeGreaterThan(0);
    expect(attempts.at(-1)?.correct).toBe(true);
    expect(attempts.slice(0, -1).every((attempt) => !attempt.correct)).toBe(true);
    expect(result.current.round.score).toBeGreaterThanOrEqual(100);
    expect(result.current.feed.get().verdict).toMatchObject({ key: 1, correct: true });

    // The next question comes once the scene has shown the catch.
    await act(async () => jest.advanceTimersByTime(fishingRules.nextDelayMs));
    expect(result.current.feed.get().key).toBe(2);
  });

  it('ignores a pick of a question already gone', async () => {
    const { result } = await playRound(flightRules);
    await act(async () => result.current.onEvent({ type: 'choice', key: 7, index: 0 }));
    expect(childPractice(CHILD).round?.attempts).toEqual([]);
  });

  it('ends at the last heart, keeps the round and its record on the device', async () => {
    const { result } = await playRound(gemRainRules, 50);
    await act(async () => result.current.onEvent({ type: 'points', points: 10 }));
    for (let i = 0; i < 3; i++) {
      await act(async () => result.current.onEvent({ type: 'hurt' }));
    }
    expect(result.current.phase).toBe('over');
    expect(result.current.outcome).toMatchObject({ score: 10, stars: 0, record: false });
    const child = childPractice(CHILD);
    expect(child.round).toBeNull();
    // No answer: nothing to send.
    expect(child.outbox).toEqual([]);
    expect(child.games?.records['pluie-de-gemmes']).toEqual({ score: 10, stars: 0 });
  });

  it('sends a finished round, and counts its time for the day', async () => {
    const { result } = await playRound(flightRules);
    await act(async () => result.current.onEvent({ type: 'choice', key: 1, index: 0 }));
    await act(async () => jest.advanceTimersByTime(60_000));
    await act(async () => result.current.onEvent({ type: 'time' }));
    const child = childPractice(CHILD);
    expect(child.outbox).toHaveLength(1);
    expect(child.outbox[0]).toMatchObject({
      kind: 'game',
      game: { id: 'vol-du-chaton', score: result.current.outcome?.score },
    });
    expect(child.games?.day).toMatchObject({ date: '2026-10-21', playedS: 60 });
    expect(creditOfDay(child.games?.day, { kind: 'daily', localDate: '2026-10-21' }).answers).toBe(
      0,
    );
  });

  it('grades two bubbles by what they make, and keeps the question after a wrong pair', async () => {
    const { result } = await playRound(bubblesRules);
    const feed = result.current.feed.get();
    expect(feed.labels).toHaveLength(6);
    const [, target = '', operator] = /^(\S+) = \? ([+×]) \?$/.exec(feed.prompt) ?? [];
    const value = (label: string) => Number(label.replace(/\s/g, '').replace('\u2212', '-'));
    const pairs = feed.labels.flatMap((a, i) =>
      feed.labels.slice(i + 1).map((b, k) => ({
        indexes: [i, i + 1 + k],
        makes: operator === '+' ? value(a) + value(b) : value(a) * value(b),
      })),
    );
    const right = pairs.find((pair) => pair.makes === value(target));
    const wrong = pairs.find((pair) => pair.makes !== value(target));
    if (!right || !wrong) throw new Error('no pair');

    await act(async () => result.current.onEvent({ type: 'pick', key: 1, indexes: wrong.indexes }));
    expect(result.current.feed.get().verdict).toMatchObject({
      correct: false,
      indexes: wrong.indexes,
    });
    await act(async () => jest.advanceTimersByTime(bubblesRules.nextDelayMs));
    expect(result.current.feed.get().key).toBe(1);

    await act(async () => result.current.onEvent({ type: 'pick', key: 1, indexes: right.indexes }));
    expect(childPractice(CHILD).round?.attempts.map((attempt) => attempt.correct)).toEqual([
      false,
      true,
    ]);
    await act(async () => jest.advanceTimersByTime(bubblesRules.nextDelayMs));
    expect(result.current.feed.get().key).toBe(2);
  });

  it('deals a board of pairs: a pair found is a right answer, a known mismatch a wrong one', async () => {
    const { result } = await playRound(memoryRules);
    const { key, labels } = result.current.feed.get();
    expect(labels).toHaveLength(12);
    expect(new Set(labels).size).toBe(12);
    expect(result.current.prompt).toBe('Trouve les paires');
    const attempts = () => childPractice(CHILD).round?.attempts.map((attempt) => attempt.correct);
    const pick = (indexes: number[], known: boolean) =>
      act(async () => result.current.onEvent({ type: 'pick', key, indexes, known }));

    // Two new cards that do not go together: a guess, not a mistake.
    await pick([0, 3], false);
    expect(attempts()).toEqual([]);
    expect(result.current.feed.get().verdict).toMatchObject({ correct: false, indexes: [0, 3] });
    // Two cards already seen: the calculation of pair 0 answered with the result of pair 1.
    await pick([0, 3], true);
    expect(attempts()).toEqual([false]);
    // Every pair found: pair 0 counts no more, the others are right answers.
    for (let pair = 0; pair < 6; pair++) await pick([pair * 2 + 1, pair * 2], true);
    expect(attempts()).toEqual([false, true, true, true, true, true]);
    expect(result.current.round.score).toBeGreaterThanOrEqual(5 * 100 + 200);
    await act(async () => jest.advanceTimersByTime(memoryRules.nextDelayMs));
    expect(result.current.feed.get().key).toBeGreaterThan(key);
  });

  it('ends the round when the child leaves the screen', async () => {
    const { unmount } = await playRound(fishingRules);
    await act(async () => unmount());
    expect(childPractice(CHILD).round).toBeNull();
  });
});
