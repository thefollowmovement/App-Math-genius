import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DEFAULT_LOOKS } from '@math-genius/shared';
import { THEME_IDS } from '@math-genius/ui';

import { lookOf, pickCosmetic, sameLook, withHero } from './look-model';

const lea = { theme_id: 'space', avatar: {}, gender: 'girl' } as const;
const nothing = { badges: new Set<string>(), owned: new Set<string>() };

describe('look', () => {
  it('reads the stored theme and avatar, or the defaults of the profile', () => {
    expect(lookOf(lea)).toEqual({ theme: 'space', avatar: DEFAULT_LOOKS.girl.avatar });
    const avatar = { hero: 'taro', wear: { companion: 'lapin' } };
    expect(lookOf({ theme_id: 'pirates', avatar, gender: 'boy' })).toEqual({
      theme: 'neon',
      avatar,
    });
  });

  it('compares looks by theme, hero and slot', () => {
    const look = lookOf(lea);
    expect(
      sameLook(look, { ...look, avatar: { ...look.avatar, wear: { ...look.avatar.wear } } }),
    ).toBe(true);
    expect(sameLook(look, { ...look, theme: 'manga' })).toBe(false);
    expect(sameLook(look, withHero(look, 'leo'))).toBe(false);
    expect(sameLook(look, { ...look, avatar: { ...look.avatar, wear: {} } })).toBe(false);
  });

  it('wears what is unlocked, and says what the rest waits for', () => {
    const look = lookOf(lea);
    expect(pickCosmetic(look, 'aura', 'aura-pink', nothing)).toEqual({
      look: {
        ...look,
        avatar: { ...look.avatar, wear: { ...look.avatar.wear, aura: 'aura-pink' } },
      },
    });
    expect(pickCosmetic(look, 'aura', 'aura-gold', nothing)).toEqual({
      locked: { cosmetic: 'aura-gold', missing: { kind: 'badge', badge: 'streak-7' } },
    });
    expect(pickCosmetic(look, 'companion', 'lapin', nothing)).toEqual({
      locked: { cosmetic: 'lapin', missing: { kind: 'shop', item: 'lapin' } },
    });
    const bought = { ...nothing, owned: new Set(['lapin']) };
    expect(pickCosmetic(look, 'companion', 'lapin', bought)).toMatchObject({
      look: { avatar: { wear: { companion: 'lapin' } } },
    });
    // The slot can be emptied, and a cosmetic only goes in its own slot.
    expect(pickCosmetic(look, 'frame', null, nothing)).toEqual({
      look: { ...look, avatar: { ...look.avatar, wear: {} } },
    });
    expect(pickCosmetic(look, 'frame', 'aura-pink', nothing)).toBeNull();
  });

  it('only stores themes the database knows (latest private.theme_ids)', () => {
    const migrations = join(__dirname, '../../../../supabase/migrations');
    const [latest] = readdirSync(migrations)
      .sort()
      .reverse()
      .map((name) => readFileSync(join(migrations, name), 'utf8'))
      .filter((sql) => sql.includes('function private.theme_ids()'));
    const list = /private\.theme_ids\(\)[\s\S]*?select array\[([^\]]*)\]/.exec(latest ?? '')?.[1];
    const ids = (list ?? '').split(',').map((id) => id.trim().replace(/^'|'$/g, ''));
    expect(ids.sort()).toEqual([...THEME_IDS].sort());
  });
});
