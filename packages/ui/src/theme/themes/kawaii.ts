import type { Theme } from '../types';

/** Provisional kawaii theme: pastels and very round shapes. */
export const kawaii: Theme = {
  id: 'kawaii',
  colorScheme: 'light',
  colors: {
    background: '#FFF6FA',
    surface: '#FFFFFF',
    border: '#F5D3E2',
    foreground: '#46233A',
    muted: '#7A5368',
    primary: '#FFB3D1',
    onPrimary: '#46233A',
    secondary: '#BFE6F5',
    onSecondary: '#173F4F',
    danger: '#B42318',
    success: '#C9EFD3',
    onSuccess: '#1D4A2B',
  },
  radii: {
    sm: 12,
    md: 20,
    lg: 28,
  },
};
