import type { AVATAR_PARTS, AvatarPart } from '@math-genius/shared';

// Colors of the avatar drawing, like an image's: the same in every theme, never used by the
// interface (screens take theme classes). Text never sits on them.

type Options<P extends keyof typeof AVATAR_PARTS> = (typeof AVATAR_PARTS)[P][number];

export const SKIN: Record<Options<'skin'>, string> = {
  'skin-1': '#FCE5D3',
  'skin-2': '#F3C9A5',
  'skin-3': '#DDA77C',
  'skin-4': '#C08048',
  'skin-5': '#8E5A2E',
  'skin-6': '#5E3B22',
};

export const HAIR: Record<Options<'hairColor'>, string> = {
  black: '#211B18',
  'dark-brown': '#3E2618',
  brown: '#6E4224',
  blond: '#E6C068',
  red: '#B8552C',
  blue: '#3F7FD9',
  pink: '#F07CB2',
  gold: '#F4B400',
};

export const OUTFIT: Record<Options<'outfitColor'>, string> = {
  red: '#E2505F',
  blue: '#3E8CDA',
  green: '#3BB37A',
  yellow: '#F4C842',
  purple: '#9C6DDA',
  orange: '#F28C38',
};

/** Lines and shades shared by every part. */
export const INK = '#2B2321';
export const WHITE = '#FFFFFF';
export const CLOTH = '#F2F4F8';
export const SILVER = '#C6CCD8';
export const CHEEK = '#F59AAE';
export const GOLD = '#F4B400';
export const SHADE = '#000000';

/** The parts chosen as a color, and their colors. */
export const SWATCHES: Partial<Record<AvatarPart, Readonly<Record<string, string>>>> = {
  skin: SKIN,
  hairColor: HAIR,
  outfitColor: OUTFIT,
};
