import type { Theme } from '../types';

/** Space: night blue, planets and stars, a futuristic font. A dark theme. */
export const space: Theme = {
  id: 'space',
  colorScheme: 'dark',
  colors: {
    background: '#0B1026',
    surface: '#161D40',
    border: '#2F3A73',
    foreground: '#EEF1FF',
    muted: '#AAB3E0',
    primary: '#A99BFF',
    onPrimary: '#0B1026',
    secondary: '#45D1C9',
    onSecondary: '#04232A',
    danger: '#FF8A80',
    success: '#7BE0A6',
    onSuccess: '#06311C',
  },
  radii: {
    sm: 10,
    md: 16,
    lg: 22,
  },
  typography: { headingFont: 'Orbitron_700Bold', headingWeight: '700' },
  // Flat buttons.
  relief: { depth: 0, color: '#00000000' },
  art: {
    decor: 'stars',
    decorColors: ['#2F3A73', '#FFE58A'],
  },
};
