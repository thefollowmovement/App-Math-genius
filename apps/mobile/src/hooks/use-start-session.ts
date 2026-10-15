import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';

import type { Child } from '@/data/children';
import { openSession } from '@/data/practice/practice-store';

/** Opens today's session (or resumes it) and shows it. */
export function useStartSession(child: Child | undefined) {
  const router = useRouter();
  return (mode: 'push' | 'replace' = 'push') => {
    if (!child) return;
    openSession({
      childId: child.id,
      grade: child.grade,
      now: new Date(),
      id: Crypto.randomUUID(),
      seed: Math.floor(Math.random() * 2 ** 31),
    });
    const href = { pathname: '/child/practice', params: { id: child.id } } as const;
    if (mode === 'replace') router.replace(href);
    else router.push(href);
  };
}
