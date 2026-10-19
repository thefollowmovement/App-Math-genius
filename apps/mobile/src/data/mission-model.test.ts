import { worldMap } from '@math-genius/exercise-engine';

import { currentStop, missionSegments } from './mission-model';

const at = '2026-10-19T17:00:00Z';

describe('currentStop', () => {
  it('starts at the first open skill of the first island', () => {
    const stop = currentStop(worldMap({ grade: 'CE2', mastery: {}, at, defeated: [] }));
    expect(stop?.island.domain).toBe('numbers');
    expect(['to_discover', 'in_progress']).toContain(stop?.node.status);
  });

  it('moves on once a skill is mastered, and ends when nothing open is left', () => {
    const islands = worldMap({ grade: 'CE2', mastery: {}, at, defeated: [] });
    const first = currentStop(islands);
    const mastered = islands.map((island) => ({
      ...island,
      skills: island.skills.map((node) =>
        node.code === first?.node.code ? { ...node, status: 'mastered' as const } : node,
      ),
    }));
    expect(currentStop(mastered)?.node.code).not.toBe(first?.node.code);
    const allMastered = islands.map((island) => ({
      ...island,
      skills: island.skills.map((node) => ({ ...node, status: 'mastered' as const })),
    }));
    expect(currentStop(allMastered)).toBeNull();
  });
});

describe('missionSegments', () => {
  it('fills a quarter at a time, and all once done', () => {
    expect(missionSegments({ status: 'ready' })).toBe(0);
    expect(missionSegments({ status: 'in-progress', percent: 40 })).toBe(1);
    expect(missionSegments({ status: 'in-progress', percent: 99 })).toBe(3);
    expect(missionSegments({ status: 'done' })).toBe(4);
    expect(missionSegments({ status: 'unavailable' })).toBe(0);
  });
});
