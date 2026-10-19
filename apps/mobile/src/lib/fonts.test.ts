import { themes } from '@math-genius/ui';

import { THEME_FONTS } from './fonts';

describe('theme fonts', () => {
  it.each(Object.values(themes))('loads the heading font of theme $id', (theme) => {
    expect(Object.keys(THEME_FONTS)).toContain(theme.typography.headingFont);
  });
});
