import type { Theme } from '../types';

/** Manga: ink on paper, strong contrasts, sharp corners and a comic font. */
export const manga: Theme = {
  id: 'manga',
  colorScheme: 'light',
  colors: {
    background: '#FFFDF4',
    surface: '#FFFFFF',
    raised: '#FFFFFF',
    border: '#2B2B2B',
    foreground: '#141414',
    muted: '#4A4A4A',
    primary: '#FFD23F',
    onPrimary: '#141414',
    secondary: '#C1121F',
    onSecondary: '#FFFFFF',
    accent: '#FF8C1A',
    onAccent: '#141414',
    danger: '#A4161A',
    success: '#B9F3CB',
    onSuccess: '#0B3D1C',
    primaryInk: '#7A5C00',
    secondaryInk: '#C1121F',
    accentInk: '#9A4A00',
    successInk: '#0B6B2E',
    fire: '#B54708',
  },
  radii: {
    sm: 4,
    md: 6,
    lg: 10,
  },
  typography: { headingFont: 'Bangers_400Regular', headingWeight: '400' },
  // Flat buttons.
  relief: { depth: 0, color: '#00000000' },
  glow: { radius: 0, strength: 0 },
  art: {
    decor: 'speed-lines',
    decorColors: ['#EDE8D8', '#FFE58A'],
  },
};
