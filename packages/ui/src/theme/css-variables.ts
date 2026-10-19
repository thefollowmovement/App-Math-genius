import type { Theme } from './types';

export type CssVariables = Record<`--${string}`, string | number>;

/** Native styles take unitless numbers; web CSS needs explicit units. */
export type StylePlatform = 'native' | 'web';

const toKebabCase = (value: string) =>
  value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** Maps a theme to the `--theme-*` variables that `global.css` binds to Tailwind tokens. */
export function themeToCssVariables(theme: Theme, platform: StylePlatform): CssVariables {
  const variables: CssVariables = {};

  for (const [name, value] of Object.entries(theme.colors)) {
    variables[`--theme-color-${toKebabCase(name)}`] = value;
  }

  for (const [name, value] of Object.entries(theme.radii)) {
    variables[`--theme-radius-${name}`] = platform === 'web' ? `${value}px` : value;
  }

  variables['--theme-font-heading'] = theme.typography.headingFont;
  variables['--theme-font-heading-weight'] = theme.typography.headingWeight;
  // Read only by the classes ThemedText adds when the theme has a body font.
  const { bodyFont } = theme.typography;
  if (bodyFont) {
    variables['--theme-font-body'] = bodyFont.regular;
    variables['--theme-font-body-semibold'] = bodyFont.semibold;
  }

  variables['--theme-relief-depth'] =
    platform === 'web' ? `${theme.relief.depth}px` : theme.relief.depth;
  variables['--theme-relief-color'] = theme.relief.color;

  return variables;
}
