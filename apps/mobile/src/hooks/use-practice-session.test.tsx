import type { ExerciseResponse } from '@math-genius/exercise-engine';
import { act, renderHook } from '@testing-library/react-native';

import { childPractice, openSession, usePracticeStore } from '@/data/practice/practice-store';
import { rightResponse } from '@/test-utils/responses';

import { usePracticeSession } from './use-practice-session';

jest.mock('@/data/practice/sync', () => ({ syncNow: jest.fn(() => Promise.resolve()) }));

const CHILD = 'child-1';

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 15, 17) });
  usePracticeStore.setState({ children: {}, itemRatings: {} });
  openSession({
    childId: CHILD,
    grade: 'CM1',
    now: new Date(),
    id: 'session-1',
    seed: 5,
    goal: { type: 'count', count: 6 },
  });
});

afterEach(() => jest.useRealTimers());

async function renderSession() {
  const onFinished = jest.fn();
  const hook = await renderHook(() => usePracticeSession(CHILD, onFinished));
  return { ...hook, onFinished };
}

/** A response of another type than the exercise: the engine cannot read it. */
const unreadable = (type: string): ExerciseResponse =>
  type === 'choice' ? { type: 'true-false', value: true } : { type: 'choice', index: 0 };

describe('usePracticeSession', () => {
  it('saves each answer at once and keeps the answered exercise on screen', async () => {
    const { result } = await renderSession();
    const first = result.current.exercise;
    if (!first) throw new Error('No exercise');

    await act(async () => {
      jest.advanceTimersByTime(6000);
      result.current.submit(rightResponse(first));
    });
    expect(result.current.feedback).toMatchObject({ correct: true, finished: false });
    expect(result.current.exercise).toBe(first);
    const [saved] = childPractice(CHILD).active?.attempts ?? [];
    expect(saved).toMatchObject({ correct: true, timeMs: 6000, response: rightResponse(first) });

    await act(async () => result.current.continueSession());
    expect(result.current.feedback).toBeNull();
    expect(result.current.exercise).not.toBe(first);
  });

  it('asks to fix an unreadable answer without recording it', async () => {
    const { result } = await renderSession();
    const exercise = result.current.exercise;
    if (!exercise) throw new Error('No exercise');

    await act(async () => result.current.submit(unreadable(exercise.type)));
    expect(result.current.notice).not.toBeNull();
    expect(result.current.feedback).toBeNull();
    expect(childPractice(CHILD).active?.attempts).toHaveLength(0);
  });

  it('records the hint and ends the session at the goal', async () => {
    const { result, onFinished } = await renderSession();
    await act(async () => result.current.showHint());

    for (let i = 0; i < 6; i++) {
      const exercise = result.current.exercise;
      if (!exercise) throw new Error('No exercise');
      await act(async () => {
        jest.advanceTimersByTime(5000);
        result.current.submit(rightResponse(exercise));
      });
      if (i < 5) await act(async () => result.current.continueSession());
    }
    expect(result.current.feedback?.finished).toBe(true);
    expect(childPractice(CHILD).active?.attempts[0]?.hintUsed).toBe(true);
    expect(childPractice(CHILD).active?.attempts[1]?.hintUsed).toBe(false);

    await act(async () => result.current.continueSession());
    expect(onFinished).toHaveBeenCalled();
    expect(result.current.finished).toBe(true);
    const child = childPractice(CHILD);
    expect(child.active).toBeNull();
    expect(child.lastCompleted?.attempts).toHaveLength(6);
    expect(child.lastDailyDate).toBe('2026-10-15');
  });
});
