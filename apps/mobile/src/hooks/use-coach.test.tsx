import { coachSample, type Explanation } from '@math-genius/exercise-engine';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { fetchCoach, sendCoachFeedback } from '@/data/coach';

import { useCoach } from './use-coach';

jest.mock('@/data/coach', () => ({
  fetchCoach: jest.fn(),
  sendCoachFeedback: jest.fn(() => Promise.resolve()),
}));
const mockFetch = jest.mocked(fetchCoach);
const mockFeedback = jest.mocked(sendCoachFeedback);

const sample = coachSample('ce2.addition-posee', 'forgot-carry');
if (!sample) throw new Error('no sample');
const { exercise, response } = sample;
const explanation = (what: string): Explanation => ({ what, image: 'Imagine.', tip: 'Astuce.' });

async function renderCoach(answered = true) {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(
    ({ on }: { on: boolean }) => useCoach('child-1', on ? exercise : null, on ? response : null),
    { wrapper, initialProps: { on: answered } },
  );
}

beforeEach(() => {
  mockFetch.mockReset();
  mockFeedback.mockClear();
});

describe('useCoach', () => {
  it('asks nothing before a wrong answer', async () => {
    const { result } = await renderCoach(false);
    expect(result.current.view).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows the hero thinking, then the explanation', async () => {
    mockFetch.mockResolvedValueOnce({ id: 'e1', explanation: explanation('Première') });
    const { result } = await renderCoach();
    expect(result.current.view).toEqual({ status: 'thinking' });
    await waitFor(() => expect(result.current.view?.status).toBe('shown'));
    expect(result.current.view).toEqual({
      status: 'shown',
      explanation: explanation('Première'),
      more: true,
    });
    expect(mockFetch).toHaveBeenCalledWith('child-1', exercise, response, []);
  });

  it('explains otherwise, leaving out what was shown, and keeps the last one at the end', async () => {
    mockFetch
      .mockResolvedValueOnce({ id: 'e1', explanation: explanation('Première') })
      .mockResolvedValueOnce({ id: 'e2', explanation: explanation('Deuxième') })
      .mockResolvedValueOnce(null);
    const { result } = await renderCoach();
    await waitFor(() => expect(result.current.view?.status).toBe('shown'));

    await act(async () => result.current.explainAgain());
    expect(mockFeedback).toHaveBeenCalledWith('child-1', 'e1', false);
    await waitFor(() =>
      expect(result.current.view).toMatchObject({ explanation: explanation('Deuxième') }),
    );
    expect(mockFetch).toHaveBeenLastCalledWith('child-1', exercise, response, ['e1']);

    await act(async () => result.current.explainAgain());
    await waitFor(() => expect(result.current.view).toMatchObject({ more: false }));
    expect(result.current.view).toMatchObject({ explanation: explanation('Deuxième') });

    await act(async () => result.current.understood());
    expect(mockFeedback).toHaveBeenLastCalledWith('child-1', 'e2', true);
  });

  it('leaves the generator’s correction alone when the coach has nothing or fails', async () => {
    mockFetch.mockResolvedValueOnce(null);
    const { result } = await renderCoach();
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await waitFor(() => expect(result.current.view).toBeNull());

    mockFetch.mockRejectedValueOnce(new Error('offline'));
    const failing = await renderCoach();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(failing.result.current.view).toBeNull());
  });
});
