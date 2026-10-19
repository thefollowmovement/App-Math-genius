import type { Theme } from '../types';
import { DEFAULT_THEME, THEME_IDS, themeOf, themes } from '.';

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
  ['foreground', 'raised'],
  ['muted', 'background'],
  ['onPrimary', 'primary'],
  ['onSecondary', 'secondary'],
  ['onAccent', 'accent'],
  ['danger', 'background'],
  ['danger', 'surface'],
  ['onSuccess', 'success'],
  // Colored labels and scores, on the page and on cards.
  ...(['primaryInk', 'secondaryInk', 'accentInk', 'successInk', 'fire'] as const).flatMap(
    (ink) =>
      [
        [ink, 'background'],
        [ink, 'surface'],
      ] as [keyof Theme['colors'], keyof Theme['colors']][],
  ),
];

it('makes Neon Stage the default theme', () => {
  expect(DEFAULT_THEME).toBe('neon');
  expect(themeOf(undefined)).toBe(themes.neon);
  expect(themeOf('a-theme-from-a-newer-app')).toBe(themes.neon);
  expect(THEME_IDS[0]).toBe('neon');
});

describe.each(Object.values(themes))('theme $id', (theme) => {
  it('uses 6-digit hex colors, and #RRGGBBAA for its translucent relief', () => {
    for (const color of [...Object.values(theme.colors), ...theme.art.decorColors]) {
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    }
    expect(theme.relief.color).toMatch(/^#[0-9A-F]{8}$/i);
  });

  it('glows like neon, or not at all', () => {
    const { radius, strength } = theme.glow;
    expect(radius).toBeGreaterThanOrEqual(0);
    expect(strength).toBeGreaterThanOrEqual(0);
    expect(strength).toBeLessThanOrEqual(1);
    // A blur without color, or a color without blur, would be a hidden halo.
    expect(radius === 0).toBe(strength === 0);
  });

  it('is registered under its own id', () => {
    expect(themes[theme.id as keyof typeof themes]).toBe(theme);
  });

  it('keeps text readable over the large shapes of its backdrop (WCAG AA)', () => {
    expect(contrast(theme.colors.foreground, theme.art.decorColors[0])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(readablePairs)('keeps %s readable on %s (WCAG AA)', (text, background) => {
    expect(contrast(theme.colors[text], theme.colors[background])).toBeGreaterThanOrEqual(4.5);
  });
});
