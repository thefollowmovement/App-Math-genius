import { avatarOf, type Avatar } from '@math-genius/shared';
import { isThemeId, type ThemeId } from '@math-genius/ui';

import type { Child } from './children';

export type Look = { theme: ThemeId; avatar: Avatar };

/** The child's theme and avatar as stored, or the defaults of the profile. */
export function lookOf(child: Pick<Child, 'theme_id' | 'avatar' | 'gender'>): Look {
  return {
    theme: isThemeId(child.theme_id) ? child.theme_id : 'kawaii',
    avatar: avatarOf(child.avatar, child.gender),
  };
}

export const sameLook = (a: Look, b: Look) =>
  a.theme === b.theme &&
  (Object.keys(a.avatar) as (keyof Avatar)[]).every((part) => a.avatar[part] === b.avatar[part]);
