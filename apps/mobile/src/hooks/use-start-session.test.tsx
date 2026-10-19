import { act, renderHook } from '@testing-library/react-native';

import { childPractice, usePracticeStore } from '@/data/practice/practice-store';
import type { Routines } from '@/data/routine-plan';

import { useStartSession } from './use-start-session';

const mockPush = jest.fn();
let mockRoutines: Routines | undefined;

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn() }) }));
jest.mock('@/data/routines', () => ({ useRoutines: () => ({ data: mockRoutines }) }));

const lea = {
  id: 'lea',
  display_name: 'Léa',
  gender: 'girl',
  grade: 'CM1',
  birth_year: null,
  theme_id: 'kawaii',
  avatar: {},
} as const;

beforeEach(() => usePracticeStore.setState({ children: {}, itemRatings: {} }));

describe('useStartSession', () => {
  it('takes the goal of the child’s routine', async () => {
    mockRoutines = {
      routines: {
        lea: {
          days: [1, 2, 3, 4, 5],
          startTime: '17:00',
          wednesdayStartTime: null,
          weekendStartTime: null,
          deadlineTime: '20:30',
          goal: { type: 'count', count: 20 },
        },
      },
      vacations: [],
    };
    const { result } = await renderHook(() => useStartSession(lea));
    await act(async () => result.current());
    expect(childPractice('lea').active?.goal).toEqual({ type: 'count', count: 20 });
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/child/practice', params: { id: 'lea' } });
  });

  it('plays 15 minutes without a routine', async () => {
    mockRoutines = undefined;
    const { result } = await renderHook(() => useStartSession(lea));
    await act(async () => result.current());
    expect(childPractice('lea').active?.goal).toEqual({ type: 'duration', minutes: 15 });
  });
});
