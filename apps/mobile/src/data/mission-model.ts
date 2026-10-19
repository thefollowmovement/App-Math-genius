import type { IslandView, SkillNode } from '@math-genius/exercise-engine';

import type { PracticeStatus } from './practice/summary';

/** Skills the child can work on now: open, with exercises, not mastered yet. */
const OPEN: readonly SkillNode['status'][] = ['in_progress', 'to_review', 'to_discover'];

export type Stop = { island: IslandView; node: SkillNode };

/**
 * Where the child stands on the world map: the first skill along the paths, in programme order,
 * that is open and not mastered yet. Null once everything open is mastered.
 */
export function currentStop(islands: readonly IslandView[]): Stop | null {
  for (const island of islands) {
    const node = island.skills.find((skill) => OPEN.includes(skill.status));
    if (node) return { island, node };
  }
  return null;
}

/** The mission card's bar, in quarters: how much of today's session is done. */
export const MISSION_SEGMENTS = 4;

export function missionSegments(practice: PracticeStatus): number {
  if (practice.status === 'done') return MISSION_SEGMENTS;
  if (practice.status !== 'in-progress') return 0;
  return Math.floor((practice.percent / 100) * MISSION_SEGMENTS);
}
