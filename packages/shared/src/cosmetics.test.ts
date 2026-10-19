import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DEFAULT_LOOKS, avatarOf, avatarSchema } from './avatar';
import { BADGES } from './badges';
import { COSMETICS, COSMETIC_SLOTS, cosmeticOf, missingUnlock, type Cosmetic } from './cosmetics';
import { HERO_IDS } from './heroes';
import { SHOP_ITEMS } from './shop';

const migrations = join(__dirname, '../../../supabase/migrations');
const file = readdirSync(migrations).find((name) => name.endsWith('_neon_heroes.sql'));
const sql = readFileSync(join(migrations, file ?? ''), 'utf8');
const literal = (fn: string, pattern: string) =>
  new RegExp(`function private\\.${fn}\\(\\)[\\s\\S]*?${pattern}`).exec(sql)?.[1] ?? '';

describe('heroes and cosmetics', () => {
  it('has the heroes the database knows', () => {
    const ids = literal('hero_ids', 'select array\\[([^\\]]*)\\]')
      .split(',')
      .map((id) => id.trim().replace(/^'|'$/g, ''));
    expect(ids).toEqual([...HERO_IDS]);
  });

  it('has the cosmetics the database checks: slots and unlock conditions', () => {
    const stored = JSON.parse(literal('cosmetics', "select '([^']*)'::jsonb") || 'null');
    expect(stored).toEqual(
      Object.fromEntries(COSMETICS.map(({ id, slot, unlock }) => [id, { slot, unlock }])),
    );
  });

  it('gives every cosmetic a known slot and a unique id', () => {
    expect(new Set(COSMETICS.map(({ id }) => id)).size).toBe(COSMETICS.length);
    for (const { slot } of COSMETICS) expect(COSMETIC_SLOTS).toContain(slot);
  });

  it('unlocks with badges that exist, and sells in the shop what the shop has', () => {
    const badges = new Set<string>(BADGES.map(({ code }) => code));
    for (const { unlock } of COSMETICS) {
      if (unlock.kind === 'badge') expect(badges).toContain(unlock.badge);
    }
    // Every companion and accessory of the shop is a cosmetic of the same slot, and nothing else is.
    const worn = SHOP_ITEMS.filter(({ kind }) => kind !== 'effect');
    const sold = COSMETICS.filter(({ unlock }) => unlock.kind === 'shop');
    expect(sold.map(({ id, slot }) => [id, slot])).toEqual(
      worn.map(({ code, kind }) => [code, kind]),
    );
  });

  it('tells what is missing to wear a cosmetic', () => {
    const cosmetic = (id: string) => cosmeticOf(id) as Cosmetic;
    const none = { badges: new Set<string>(), owned: new Set<string>() };
    expect(missingUnlock(cosmetic('aura-pink'), none)).toBeNull();
    expect(missingUnlock(cosmetic('aura-gold'), none)).toEqual({
      kind: 'badge',
      badge: 'streak-7',
    });
    expect(
      missingUnlock(cosmetic('aura-gold'), { ...none, badges: new Set(['streak-7']) }),
    ).toBeNull();
    expect(missingUnlock(cosmetic('kitten'), none)).toEqual({ kind: 'shop', item: 'kitten' });
    expect(missingUnlock(cosmetic('kitten'), { ...none, owned: new Set(['kitten']) })).toBeNull();
  });
});

describe('avatar', () => {
  it('names a hero and one cosmetic of each slot it uses', () => {
    expect(avatarSchema.safeParse({ hero: 'taro', wear: { aura: 'aura-cyan' } }).success).toBe(
      true,
    );
    expect(avatarSchema.safeParse({ hero: 'taro', wear: { frame: 'aura-cyan' } }).success).toBe(
      false,
    );
    expect(avatarSchema.safeParse({ hero: 'pikachu', wear: {} }).success).toBe(false);
    expect(avatarSchema.safeParse({ hero: 'taro' }).success).toBe(false);
  });

  it('preselects a hero from the profile, in Neon Stage, wearing free cosmetics', () => {
    expect(DEFAULT_LOOKS.girl.avatar.hero).toBe('nova');
    expect(DEFAULT_LOOKS.boy.avatar.hero).toBe('kai');
    for (const { theme, avatar } of Object.values(DEFAULT_LOOKS)) {
      expect(theme).toBe('neon');
      for (const id of Object.values(avatar.wear)) {
        expect(cosmeticOf(id)?.unlock.kind).toBe('free');
      }
    }
    // The same look as private.default_avatar.
    expect(sql).toContain(
      `'wear', '${JSON.stringify(DEFAULT_LOOKS.girl.avatar.wear).replace(':', ': ')}'::jsonb`,
    );
  });

  it('falls back on the default look until one is chosen', () => {
    expect(avatarOf({}, 'boy')).toEqual(DEFAULT_LOOKS.boy.avatar);
    const chosen = { hero: 'leo', wear: { companion: 'kitten' } };
    expect(avatarOf(chosen, 'girl')).toEqual(chosen);
    // An avatar of phase 6b (drawn parts) reads as the default look.
    expect(avatarOf({ skin: 'skin-2', hair: 'long' }, 'girl')).toEqual(DEFAULT_LOOKS.girl.avatar);
  });
});
