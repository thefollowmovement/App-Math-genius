import { themeToCssVariables } from './css-variables';
import { themes } from './themes';

describe('themeToCssVariables', () => {
  const theme = themes.kawaii;

  it('exposes colors as kebab-case variables', () => {
    const variables = themeToCssVariables(theme, 'native');

    expect(variables['--theme-color-background']).toBe(theme.colors.background);
    expect(variables['--theme-color-on-primary']).toBe(theme.colors.onPrimary);
  });

  it('keeps radii unitless on native and in pixels on web', () => {
    expect(themeToCssVariables(theme, 'native')['--theme-radius-lg']).toBe(theme.radii.lg);
    expect(themeToCssVariables(theme, 'web')['--theme-radius-lg']).toBe(`${theme.radii.lg}px`);
  });
});
