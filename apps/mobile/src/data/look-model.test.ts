import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DEFAULT_LOOKS } from '@math-genius/shared';
import { THEME_IDS } from '@math-genius/ui';

import { lookOf, pickOption, sameLook, withPart } from './look-model';

const lea = { theme_id: 'space', avatar: {}, gender: 'girl' } as const;

describe('look', () => {
  it('reads the stored theme and avatar, or the defaults of the profile', () => {
    expect(lookOf(lea)).toEqual({ theme: 'space', avatar: DEFAULT_LOOKS.girl.avatar });
    const avatar = { ...DEFAULT_LOOKS.boy.avatar, hair: 'curly' };
    expect(lookOf({ theme_id: 'pirates', avatar, gender: 'boy' })).toEqual({
      theme: 'kawaii',
      avatar,
    });
  });

  it('compares looks part by part', () => {
    const look = lookOf(lea);
    expect(sameLook(look, { ...look, avatar: { ...look.avatar } })).toBe(true);
    expect(sameLook(look, { ...look, theme: 'manga' })).toBe(false);
    expect(sameLook(look, { ...look, avatar: { ...look.avatar, eyes: 'wink' } })).toBe(false);
  });

  it('changes one part at a time, with options that exist', () => {
    const { avatar } = lookOf(lea);
    expect(withPart(avatar, 'hair', 'bun')).toEqual({ ...avatar, hair: 'bun' });
    expect(withPart(avatar, 'hair', 'mohawk')).toBeNull();
  });

  it('keeps rare options for the children who earned their badge', () => {
    const look = lookOf(lea);
    expect(pickOption(look, 'outfit', 'cape', new Set())).toEqual({
      locked: { part: 'outfit', option: 'cape', badge: 'streak-7' },
    });
    expect(pickOption(look, 'outfit', 'cape', new Set(['streak-7']))).toEqual({
      look: { ...look, avatar: { ...look.avatar, outfit: 'cape' } },
    });
    expect(pickOption(look, 'eyes', 'wink', new Set())).toEqual({
      look: { ...look, avatar: { ...look.avatar, eyes: 'wink' } },
    });
    expect(pickOption(look, 'eyes', 'laser', new Set())).toBeNull();
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
