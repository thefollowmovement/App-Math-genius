import type { Island } from '@math-genius/exercise-engine';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';

import type { Child } from '@/data/children';
import { openSession } from '@/data/practice/practice-store';
import { routineOf } from '@/data/routine-plan';
import { useRoutines } from '@/data/routines';

/**
 * Opens today's session (or resumes it, with the goal it started with) and shows it. A new session
 * takes its goal from the child's routine, kept on the device for offline starts.
 */
export function useStartSession(child: Child | undefined) {
  const router = useRouter();
  const routines = useRoutines();
  /** With `boss`, the island's boss (the map only offers it when no session is in progress). */
  return (mode: 'push' | 'replace' = 'push', boss?: Island) => {
    if (!child) return;
    openSession({
      childId: child.id,
      grade: child.grade,
      now: new Date(),
      id: Crypto.randomUUID(),
      seed: Math.floor(Math.random() * 2 ** 31),
      goal: routineOf(routines.data, child.id)?.goal,
      boss,
    });
    const href = { pathname: '/child/practice', params: { id: child.id } } as const;
    if (mode === 'replace') router.replace(href);
    else router.push(href);
  };
}
