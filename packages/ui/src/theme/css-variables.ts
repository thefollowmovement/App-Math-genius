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

  return variables;
}
