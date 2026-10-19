import { DOMAINS, getSkill } from '@math-genius/curriculum';

import type { MasteryRecord } from './mastery';
import { bossLength, bossSkills, islandKey, worldMap } from './islands';
import { planNext, type PlannerContext } from './planner';

const at = '2026-10-18T17:00:00.000Z';
const mastered: MasteryRecord = {
  elo: 1500,
  attempts: 30,
  streak: 2,
  masteredAt: '2026-10-15T17:00:00.000Z',
  practicedAt: '2026-10-17T17:00:00.000Z',
};
const measures = { grade: 'CE2', domain: 'measures' } as const;
const numbers = { grade: 'CE2', domain: 'numbers' } as const;

describe('worldMap', () => {
  it('has one island per domain of the grade, with every skill of the programme', () => {
    const map = worldMap({ grade: 'CE2', mastery: {}, at, defeated: [] });
    expect(map.map((island) => island.domain)).toEqual([...DOMAINS]);
    for (const island of map) {
      expect(island.skills.every(({ code }) => getSkill(code).grade === 'CE2')).toBe(true);
      expect(island.skills.every(({ code }) => getSkill(code).domain === island.domain)).toBe(true);
      expect(island.playable).toBe(bossSkills(island).length);
      expect(island.boss).toBe('locked');
    }
  });

  it('shows skills without exercises as coming soon, and those to unlock as locked', () => {
    const [island] = worldMap({ grade: 'CE2', mastery: {}, at, defeated: [] });
    const playable = new Set<string>(bossSkills(numbers));
    for (const node of island?.skills ?? []) {
      if (!playable.has(node.code)) expect(node.status).toBe('coming_soon');
      else expect(['to_discover', 'locked']).toContain(node.status);
    }
    // ce2.multiplication-posee needs the tables, practised in CE2.
    const posee = island?.skills.find((node) => node.code === 'ce2.multiplication-posee');
    expect(posee?.status).toBe('locked');
  });

  it('readies the boss once every skill with exercises was mastered, even if it fades', () => {
    const codes = bossSkills(measures);
    expect(codes.length).toBeGreaterThan(0);
    const all = Object.fromEntries(codes.map((code) => [code, mastered]));
    const faded = { ...mastered, practicedAt: '2026-08-01T17:00:00.000Z' };
    const fading = Object.fromEntries(codes.map((code) => [code, faded]));
    const islandOf = (mastery: typeof all, defeated: string[] = []) =>
      worldMap({ grade: 'CE2', mastery, at, defeated }).find((i) => i.domain === 'measures');

    expect(islandOf(all)).toMatchObject({ boss: 'ready', mastered: codes.length });
    expect(islandOf(fading)?.skills.find((node) => node.code === codes[0])?.status).toBe(
      'to_review',
    );
    expect(islandOf(fading)?.boss).toBe('ready');
    expect(islandOf(all, [islandKey(measures)])?.boss).toBe('defeated');
    expect(islandOf({})?.boss).toBe('locked');
  });
});

describe('boss sessions', () => {
  const context: PlannerContext = {
    childGrade: 'CE2',
    mastery: {},
    itemRatings: {},
    startedAt: at,
    seed: 7,
    boss: numbers,
  };

  it('ask every skill of the island in turn, 2 each within 6 to 10 exercises', () => {
    const codes = bossSkills(numbers);
    const length = bossLength(numbers);
    expect(length).toBe(Math.min(10, Math.max(6, 2 * codes.length)));
    const planned = Array.from({ length }, (_, index) =>
      planNext(context, Array.from({ length: index })),
    );
    expect(planned.every((exercise) => exercise && codes.includes(exercise.skill))).toBe(true);
    expect(new Set(planned.map((exercise) => exercise?.skill)).size).toBe(
      Math.min(codes.length, length),
    );
    expect(planned.every((exercise) => exercise?.slot === 'current' && !exercise.reminder)).toBe(
      true,
    );
  });

  it('replay identically', () => {
    const first = planNext(context, []);
    expect(planNext(context, [])).toEqual(first);
    expect(planNext({ ...context, boss: measures }, [])?.skill).toBe(bossSkills(measures)[0]);
  });

  it('have nothing to ask on an island without exercises', () => {
    const empty = { grade: 'CE2', domain: 'data' } as const;
    if (bossSkills(empty).length === 0) {
      expect(planNext({ ...context, boss: empty }, [])).toBeNull();
    }
    expect(bossLength(empty)).toBeGreaterThanOrEqual(6);
  });
});
