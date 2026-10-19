import { themes } from '@math-genius/ui';

import { THEME_FONTS } from './fonts';

describe('theme fonts', () => {
  it.each(Object.values(themes))('loads every font of theme $id', (theme) => {
    const { headingFont, bodyFont } = theme.typography;
    const fonts = [headingFont, ...(bodyFont ? [bodyFont.regular, bodyFont.semibold] : [])];
    for (const font of fonts) expect(Object.keys(THEME_FONTS)).toContain(font);
  });
});
