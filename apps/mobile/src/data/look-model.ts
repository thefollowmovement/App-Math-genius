import {
  avatarLock,
  avatarOf,
  avatarSchema,
  type Avatar,
  type AvatarPart,
  type BadgeCode,
} from '@math-genius/shared';
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
  (Object.keys(a.avatar) as AvatarPart[]).every((part) => a.avatar[part] === b.avatar[part]);

/** The avatar with one part changed, or null when the option does not exist. */
export function withPart(avatar: Avatar, part: AvatarPart, option: string): Avatar | null {
  const parsed = avatarSchema.safeParse({ ...avatar, [part]: option });
  return parsed.success ? parsed.data : null;
}

/** A rare option the child tried without its badge. */
export type LockedHint = { part: AvatarPart; option: string; badge: BadgeCode };

/**
 * The look with an option picked, or why it cannot be: a rare option waits for its badge
 * (`earned`; the server checks it again). Null for an option that does not exist.
 */
export function pickOption(
  look: Look,
  part: AvatarPart,
  option: string,
  earned: ReadonlySet<string>,
): { look: Look } | { locked: LockedHint } | null {
  const badge = avatarLock(part, option);
  if (badge && !earned.has(badge)) return { locked: { part, option, badge } };
  const avatar = withPart(look.avatar, part, option);
  return avatar ? { look: { ...look, avatar } } : null;
}
