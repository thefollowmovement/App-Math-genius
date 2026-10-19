import type { Theme } from '../types';

/** Kawaii: pastels, very round shapes and a round font. */
export const kawaii: Theme = {
  id: 'kawaii',
  colorScheme: 'light',
  colors: {
    background: '#FFF6FA',
    surface: '#FFFFFF',
    raised: '#FFE9F2',
    border: '#F5D3E2',
    foreground: '#46233A',
    muted: '#7A5368',
    primary: '#FFB3D1',
    onPrimary: '#46233A',
    secondary: '#BFE6F5',
    onSecondary: '#173F4F',
    accent: '#FFE08A',
    onAccent: '#5A3D00',
    danger: '#B42318',
    success: '#C9EFD3',
    onSuccess: '#1D4A2B',
    primaryInk: '#B4236A',
    secondaryInk: '#1F6F8B',
    accentInk: '#8A5A00',
    successInk: '#1D7A3E',
    fire: '#C2410C',
  },
  radii: {
    sm: 12,
    md: 20,
    lg: 28,
  },
  typography: { headingFont: 'Fredoka_600SemiBold', headingWeight: '600' },
  // Flat buttons.
  relief: { depth: 0, color: '#00000000' },
  glow: { radius: 0, strength: 0 },
  art: {
    decor: 'bubbles',
    decorColors: ['#FFE0EC', '#DDF2FA'],
  },
};
