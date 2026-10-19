import { z } from 'zod';

import type { BadgeCode } from './badges';

/**
 * The child's avatar: one choice per part, stored as JSON on the child (children.avatar) and
 * checked by the database (supabase/migrations/*_child_look.sql holds the same catalog:
 * avatar.test.ts compares them). Option codes are stored: never rename one. The app draws them
 * (apps/mobile/src/components/avatar).
 */
export const AVATAR_PARTS = {
  skin: ['skin-1', 'skin-2', 'skin-3', 'skin-4', 'skin-5', 'skin-6'],
  hair: ['short', 'curly', 'long', 'bun', 'braids', 'spiky', 'pigtails', 'none'],
  hairColor: ['black', 'dark-brown', 'brown', 'blond', 'red', 'blue', 'pink', 'gold'],
  eyes: ['round', 'happy', 'wink', 'glasses'],
  outfit: ['tshirt', 'hoodie', 'dress', 'overalls', 'sport', 'cape', 'astronaut'],
  outfitColor: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
} as const;

export type AvatarPart = keyof typeof AVATAR_PARTS;
export const AVATAR_PART_NAMES = Object.keys(AVATAR_PARTS) as AvatarPart[];
export type Avatar = { [P in AvatarPart]: (typeof AVATAR_PARTS)[P][number] };

/** Rare options, earned with a badge ("objets rares", docs/specs.md). */
export const AVATAR_LOCKS = {
  'outfit:cape': 'streak-7',
  'outfit:astronaut': 'island-1',
  'hairColor:gold': 'combo-10',
} as const satisfies Record<string, BadgeCode>;

export function avatarLock(part: AvatarPart, option: string): BadgeCode | null {
  const key = `${part}:${option}`;
  return key in AVATAR_LOCKS ? AVATAR_LOCKS[key as keyof typeof AVATAR_LOCKS] : null;
}

export const avatarSchema = z.object({
  skin: z.enum(AVATAR_PARTS.skin),
  hair: z.enum(AVATAR_PARTS.hair),
  hairColor: z.enum(AVATAR_PARTS.hairColor),
  eyes: z.enum(AVATAR_PARTS.eyes),
  outfit: z.enum(AVATAR_PARTS.outfit),
  outfitColor: z.enum(AVATAR_PARTS.outfitColor),
});

/** The avatar and theme preselected from the profile (docs/specs.md): everything stays open. */
export const DEFAULT_LOOKS = {
  girl: {
    theme: 'kawaii',
    avatar: {
      skin: 'skin-2',
      hair: 'long',
      hairColor: 'brown',
      eyes: 'round',
      outfit: 'dress',
      outfitColor: 'purple',
    },
  },
  boy: {
    theme: 'space',
    avatar: {
      skin: 'skin-2',
      hair: 'short',
      hairColor: 'brown',
      eyes: 'round',
      outfit: 'tshirt',
      outfitColor: 'blue',
    },
  },
} as const satisfies Record<'girl' | 'boy', { theme: string; avatar: Avatar }>;

/** The stored avatar, or the default one when none was chosen yet ({}) or it is unreadable. */
export function avatarOf(stored: unknown, gender: 'girl' | 'boy'): Avatar {
  const parsed = avatarSchema.safeParse(stored);
  return parsed.success ? parsed.data : DEFAULT_LOOKS[gender].avatar;
}
