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
  art: {
    mascot: {
      body: '#8E7CFF',
      belly: '#D9D2FF',
      accent: '#45D1C9',
      cheek: '#FF9ECF',
      ink: '#0B1026',
    },
    mascotStyle: 'antenna',
    decor: 'stars',
    decorColors: ['#2F3A73', '#FFE58A'],
  },
};
