import { STRANDS } from '@math-genius/curriculum';
import { placementDue, placementRungs } from '@math-genius/exercise-engine';
import type { Grade } from '@math-genius/shared';

import type { ChildPractice } from './practice/practice-store';

/**
 * What the child's home offers about the placement test: the first one (« aventure de départ »),
 * a recheck (every three months and each school year), or the test in progress.
 */
export type PlacementOffer = 'first' | 'recheck' | 'resume' | null;

export function placementOffer(
  practice: ChildPractice | undefined,
  grade: Grade,
  today: string,
  now: Date,
): PlacementOffer {
  const active = practice?.active;
  if (active?.kind === 'placement' && active.localDate === today) return 'resume';
  // Not while another of today's sessions is under way: the test would wait behind it.
  if (active && active.localDate === today && active.attempts.length > 0) return null;
  // No exercise to place the child with (CP and CE1 for now).
  if (!STRANDS.some((strand) => placementRungs(strand, grade).length > 0)) return null;
  const placedAt = practice?.placedAt ?? null;
  if (!placementDue(placedAt, now)) return null;
  return placedAt ? 'recheck' : 'first';
}
