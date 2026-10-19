import type { Theme } from '../types';

/**
 * Neon Stage, the default theme (docs/design/personnages.md): a night-violet concert stage, neon
 * pink, cyan, gold and green, an arcade font for titles, Nunito for text, thick buttons in relief.
 */
export const neon: Theme = {
  id: 'neon',
  colorScheme: 'dark',
  colors: {
    background: '#120B2E',
    surface: '#1E1450',
    raised: '#2A1B6E',
    border: '#3A2A78',
    foreground: '#FFFFFF',
    muted: '#C3B8F0',
    primary: '#FF3EA5',
    onPrimary: '#120B2E',
    secondary: '#2EE6FF',
    onSecondary: '#120B2E',
    accent: '#FFC83D',
    onAccent: '#120B2E',
    danger: '#FF6B6B',
    success: '#3DFFA2',
    onSuccess: '#120B2E',
    primaryInk: '#FF8FCB',
    secondaryInk: '#2EE6FF',
    accentInk: '#FFC83D',
    successInk: '#3DFFA2',
    fire: '#FF7A2E',
  },
  radii: {
    sm: 10,
    md: 16,
    lg: 22,
  },
  typography: {
    headingFont: 'Bungee_400Regular',
    headingWeight: '400',
    // The mockups' heavy Nunito (docs/design/maquettes): bold text, extra-bold headlines.
    bodyFont: { regular: 'Nunito_700Bold', semibold: 'Nunito_800ExtraBold' },
  },
  relief: { depth: 6, color: '#00000066' },
  // Neon tubes: a halo in the color of what glows.
  glow: { radius: 24, strength: 0.5 },
  art: {
    // Pink and cyan stage light, as halos in two corners (what they look like over the night).
    decor: 'glows',
    decorColors: ['#4A1656', '#0F3A5C'],
  },
};
