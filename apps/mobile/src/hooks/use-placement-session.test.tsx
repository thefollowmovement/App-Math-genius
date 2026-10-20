import { SKIPPED_ANSWER, type ExerciseResponse } from '@math-genius/exercise-engine';
import { act, renderHook } from '@testing-library/react-native';

import {
  childPractice,
  openSession,
  recordAnswer,
  usePracticeStore,
} from '@/data/practice/practice-store';
import { rightResponse } from '@/test-utils/responses';

import { usePlacementSession } from './use-placement-session';

jest.mock('@/data/practice/sync', () => ({ syncNow: jest.fn(() => Promise.resolve()) }));

const CHILD = 'child-1';

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 20, 17) });
  usePracticeStore.setState({ children: {}, itemRatings: {} });
  openSession({
    childId: CHILD,
    grade: 'CM1',
    now: new Date(),
    id: 'test-1',
    seed: 5,
    placement: true,
  });
});

afterEach(() => jest.useRealTimers());

async function renderTest() {
  const onFinished = jest.fn();
  const hook = await renderHook(() => usePlacementSession(CHILD, onFinished));
  return { ...hook, onFinished };
}

/** A response of another type than the exercise: the engine cannot read it. */
const unreadable = (type: string): ExerciseResponse =>
  type === 'choice' ? { type: 'true-false', value: true } : { type: 'choice', index: 0 };

describe('usePlacementSession', () => {
  it('moves on at once after an answer, with no correction', async () => {
    const { result } = await renderTest();
    const first = result.current.exercise;
    if (!first) throw new Error('No question');
    await act(async () => {
      jest.advanceTimersByTime(9000);
      result.current.submit(rightResponse(first));
    });
    const [saved] = childPractice(CHILD).active?.attempts ?? [];
    expect(saved).toMatchObject({ correct: true, timeMs: 9000 });
    expect(result.current.exercise).not.toBe(first);
    expect(result.current.progress).toBeGreaterThan(0);
  });

  it('asks again for an answer it cannot read, without counting it', async () => {
    const { result } = await renderTest();
    const first = result.current.exercise;
    if (!first) throw new Error('No question');
    await act(async () => result.current.submit(unreadable(first.type)));
    expect(result.current.notice).not.toBeNull();
    expect(childPractice(CHILD).active?.attempts).toHaveLength(0);
  });

  it('ends a test whose last answer was saved but not closed (the app was closed)', async () => {
    // Plays the whole test, then reopens the last answer's state without the closing.
    const first = await renderTest();
    for (let i = 0; i < 30 && !first.result.current.finished; i++) {
      await act(async () => first.result.current.skip());
    }
    const [test] = childPractice(CHILD).outbox;
    if (!test) throw new Error('no test');
    await first.unmount();
    usePracticeStore.setState({ children: {}, itemRatings: {} });
    openSession({
      childId: CHILD,
      grade: 'CM1',
      now: new Date(),
      id: 'test-2',
      seed: 5,
      placement: true,
    });
    for (const attempt of test.attempts) recordAnswer(CHILD, 'test-2', attempt);

    const { onFinished } = await renderTest();
    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(childPractice(CHILD).active).toBeNull();
    expect(childPractice(CHILD).placedAt).toBe(test.attempts.at(-1)?.answeredAt);
  });

  it('counts « Je ne sais pas » as a wrong answer, and ends once the child is placed', async () => {
    const { result, onFinished } = await renderTest();
    for (let i = 0; i < 30 && !result.current.finished; i++) {
      await act(async () => {
        jest.advanceTimersByTime(10_000);
        result.current.skip();
      });
    }
    expect(onFinished).toHaveBeenCalledTimes(1);
    const child = childPractice(CHILD);
    const [test] = child.outbox;
    expect(test?.attempts.every((attempt) => !attempt.correct)).toBe(true);
    expect(test?.attempts[0]?.response).toEqual(SKIPPED_ANSWER);
    expect(child.placedAt).toBe(test?.completedAt);
  });
});
