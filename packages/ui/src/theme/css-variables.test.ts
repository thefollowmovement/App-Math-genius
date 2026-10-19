import { themeToCssVariables } from './css-variables';
import { themes } from './themes';

describe('themeToCssVariables', () => {
  const theme = themes.kawaii;

  it('exposes colors as kebab-case variables', () => {
    const variables = themeToCssVariables(theme, 'native');

    expect(variables['--theme-color-background']).toBe(theme.colors.background);
    expect(variables['--theme-color-on-primary']).toBe(theme.colors.onPrimary);
  });

  it('names the heading font and its weight', () => {
    const variables = themeToCssVariables(themes.manga, 'native');
    expect(variables['--theme-font-heading']).toBe('Bangers_400Regular');
    expect(variables['--theme-font-heading-weight']).toBe('400');
  });

  it('keeps radii unitless on native and in pixels on web', () => {
    expect(themeToCssVariables(theme, 'native')['--theme-radius-lg']).toBe(theme.radii.lg);
    expect(themeToCssVariables(theme, 'web')['--theme-radius-lg']).toBe(`${theme.radii.lg}px`);
  });
});
