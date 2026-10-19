import type { Theme } from '../types';
import { themes } from '.';

// WCAG 2.x relative luminance and contrast ratio.
function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

const readablePairs: [keyof Theme['colors'], keyof Theme['colors']][] = [
  ['foreground', 'background'],
  ['foreground', 'surface'],
  ['muted', 'background'],
  ['onPrimary', 'primary'],
  ['onSecondary', 'secondary'],
];

describe.each(Object.values(themes))('theme $id', (theme) => {
  it('uses 6-digit hex colors', () => {
    for (const color of Object.values(theme.colors)) {
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it.each(readablePairs)('keeps %s readable on %s (WCAG AA)', (text, background) => {
    expect(contrast(theme.colors[text], theme.colors[background])).toBeGreaterThanOrEqual(4.5);
  });
});
