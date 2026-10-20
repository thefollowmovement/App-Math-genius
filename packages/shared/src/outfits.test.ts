import { BADGES } from './badges';
import { COSMETICS, missingUnlock, type Cosmetic } from './cosmetics';
import { OUTFITS, heroLook, isOutfitId, outfitOf } from './outfits';
import { SHOP_ITEMS } from './shop';

describe('outfits', () => {
  it('are sport, astronaute and magie, one slot for all', () => {
    expect(OUTFITS.map(({ id }) => id)).toEqual(['sport', 'astronaute', 'magie']);
    const outfits = COSMETICS.filter(({ slot }) => slot === 'outfit');
    expect(outfits.map(({ id }) => id)).toEqual(['sport', 'astronaute', 'magie']);
  });

  it('unlock with gems or with the end of the first island', () => {
    const price = (code: string) => SHOP_ITEMS.find((item) => item.code === code)?.price;
    expect([price('sport'), price('magie')]).toEqual([100, 200]);
    expect(SHOP_ITEMS.find(({ code }) => code === 'sport')?.kind).toBe('outfit');
    const astronaut = OUTFITS.find(({ id }) => id === 'astronaute');
    expect(astronaut?.unlock).toEqual({ kind: 'badge', badge: 'island-1' });
    expect(BADGES.find(({ code }) => code === 'island-1')).toMatchObject({
      metric: 'islands_completed',
      threshold: 1,
    });
    const cosmetic = COSMETICS.find(({ id }) => id === 'astronaute') as Cosmetic;
    const none = { badges: new Set<string>(), owned: new Set<string>() };
    expect(missingUnlock(cosmetic, none)).toEqual({ kind: 'badge', badge: 'island-1' });
    expect(missingUnlock(cosmetic, { ...none, badges: new Set(['island-1']) })).toBeNull();
  });

  it('tell how the hero is drawn: its stage outfit until it wears another', () => {
    expect(heroLook({ hero: 'kai', wear: { outfit: 'magie', frame: 'frame-neon' } })).toEqual({
      hero: 'kai',
      outfit: 'magie',
    });
    expect(heroLook({ hero: 'kai', wear: {} })).toEqual({ hero: 'kai', outfit: null });
    expect(outfitOf({ hero: 'nova', wear: { companion: 'chat' } })).toBeNull();
    expect(isOutfitId('pirate')).toBe(false);
  });
});
