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
    border: '#3A2A78',
    foreground: '#FFFFFF',
    muted: '#C3B8F0',
    primary: '#FF3EA5',
    onPrimary: '#120B2E',
    secondary: '#2EE6FF',
    onSecondary: '#120B2E',
    danger: '#FF6B6B',
    success: '#3DFFA2',
    onSuccess: '#120B2E',
  },
  radii: {
    sm: 10,
    md: 16,
    lg: 22,
  },
  typography: {
    headingFont: 'Bungee_400Regular',
    headingWeight: '400',
    bodyFont: { regular: 'Nunito_400Regular', semibold: 'Nunito_600SemiBold' },
  },
  relief: { depth: 5, color: '#00000066' },
  art: {
    // Stage spotlights in the violet of the borders, gold sparkles.
    decor: 'spotlights',
    decorColors: ['#3A2A78', '#FFC83D'],
  },
};
