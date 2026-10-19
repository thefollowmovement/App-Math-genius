import { BADGES } from './badges';
import {
  COMPANIONS,
  COMPANION_SPECIALTIES,
  RARITIES,
  companionLook,
  companionOf,
  companionsUnlockedBy,
  isCompanionId,
} from './companions';
import { SHOP_ITEMS } from './shop';

describe('companions', () => {
  it('are eight, each with its own specialty', () => {
    expect(COMPANIONS.map(({ id }) => id)).toEqual([
      'hibou',
      'lapin',
      'dragon',
      'licorne',
      'tigre',
      'renard',
      'chat',
      'phenix',
    ]);
    expect(new Set(COMPANIONS.map(({ specialty }) => specialty))).toEqual(
      new Set(COMPANION_SPECIALTIES),
    );
    for (const { rarity } of COMPANIONS) expect(RARITIES).toContain(rarity);
  });

  it('unlock as docs/design/compagnons.md and the shop say', () => {
    const unlock = Object.fromEntries(COMPANIONS.map(({ id, unlock }) => [id, unlock]));
    expect(unlock).toEqual({
      hibou: { kind: 'badge', badge: 'first-exercise' },
      lapin: { kind: 'shop', item: 'lapin' },
      dragon: { kind: 'shop', item: 'dragon' },
      licorne: { kind: 'shop', item: 'licorne' },
      tigre: { kind: 'badge', badge: 'streak-7' },
      renard: { kind: 'shop', item: 'renard' },
      chat: { kind: 'badge', badge: 'island-2' },
      phenix: { kind: 'badge', badge: 'level-10' },
    });
    const price = (code: string) => SHOP_ITEMS.find((item) => item.code === code)?.price;
    expect([price('lapin'), price('dragon'), price('licorne'), price('renard')]).toEqual([
      80, 120, 150, 250,
    ]);
    const badge = (code: string) => BADGES.find((item) => item.code === code);
    expect(badge('first-exercise')).toMatchObject({ metric: 'exercises_done', threshold: 1 });
    expect(badge('streak-7')).toMatchObject({ metric: 'streak_best', threshold: 7 });
    expect(badge('island-2')).toMatchObject({ metric: 'islands_completed', threshold: 2 });
    expect(badge('level-10')).toMatchObject({ metric: 'level', threshold: 10 });
  });

  it('are rarer as they are harder to get', () => {
    const rarity = Object.fromEntries(COMPANIONS.map(({ id, rarity }) => [id, rarity]));
    expect(rarity).toEqual({
      hibou: 'common',
      lapin: 'rare',
      dragon: 'rare',
      licorne: 'rare',
      tigre: 'epic',
      renard: 'epic',
      chat: 'epic',
      phenix: 'legendary',
    });
  });

  it('tell the companion beside the hero, at its stage', () => {
    expect(companionLook({ hero: 'nova', wear: { companion: 'dragon' } })).toEqual({
      id: 'dragon',
      stage: 1,
    });
    expect(companionLook({ hero: 'nova', wear: { frame: 'frame-neon' } })).toBeNull();
    expect(companionOf('phenix')?.specialty).toBe('fire');
    expect(isCompanionId('kitten')).toBe(false);
  });

  it('tell which companions new badges unlock', () => {
    expect(companionsUnlockedBy(['sessions-1', 'first-exercise'])).toEqual(['hibou']);
    expect(companionsUnlockedBy(['streak-7', 'level-10'])).toEqual(['tigre', 'phenix']);
    expect(companionsUnlockedBy(['streak-3'])).toEqual([]);
  });
});
