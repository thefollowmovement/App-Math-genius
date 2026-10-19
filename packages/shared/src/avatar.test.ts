import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { AVATAR_LOCKS, AVATAR_PARTS, DEFAULT_LOOKS, avatarLock, avatarOf } from './avatar';
import { BADGES } from './badges';

const migrations = join(__dirname, '../../../supabase/migrations');
const file = readdirSync(migrations).find((name) => name.endsWith('_child_look.sql'));
const sql = readFileSync(join(migrations, file ?? ''), 'utf8');
const jsonOf = (fn: string) =>
  JSON.parse(
    new RegExp(`function private\\.${fn}\\(\\)[\\s\\S]*?select '([^']*)'::jsonb`).exec(sql)?.[1] ??
      'null',
  );

describe('avatar', () => {
  it('has the parts and rare options the database checks', () => {
    expect(jsonOf('avatar_parts')).toEqual(AVATAR_PARTS);
    expect(jsonOf('avatar_locks')).toEqual(AVATAR_LOCKS);
  });

  it('opens rare options with badges that exist', () => {
    const codes = new Set<string>(BADGES.map((badge) => badge.code));
    expect(Object.values(AVATAR_LOCKS).every((code) => codes.has(code))).toBe(true);
    expect(avatarLock('outfit', 'cape')).toBe('streak-7');
    expect(avatarLock('outfit', 'tshirt')).toBeNull();
  });

  it('preselects free options from the profile', () => {
    for (const { avatar } of Object.values(DEFAULT_LOOKS)) {
      for (const [part, option] of Object.entries(avatar)) {
        expect(avatarLock(part as keyof typeof AVATAR_PARTS, option)).toBeNull();
      }
    }
  });

  it('falls back on the default avatar until one is chosen', () => {
    expect(avatarOf({}, 'boy')).toEqual(DEFAULT_LOOKS.boy.avatar);
    const chosen = { ...DEFAULT_LOOKS.girl.avatar, hair: 'bun' };
    expect(avatarOf(chosen, 'boy')).toEqual(chosen);
    expect(avatarOf({ ...chosen, hair: 'mohawk' }, 'girl')).toEqual(DEFAULT_LOOKS.girl.avatar);
  });
});
