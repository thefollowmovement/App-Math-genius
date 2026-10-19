import { themes } from '@math-genius/ui';
import { screen } from '@testing-library/react-native';

import { renderWithTheme } from '@/test-utils/render';

import { Decor } from './decor';

describe.each(Object.values(themes))('Decor in theme $id', (theme) => {
  it('draws its corners out of reach of touches and screen readers', async () => {
    const { toJSON } = await renderWithTheme(<Decor />, theme);
    expect(toJSON()).toBeTruthy();
    expect(screen.root).toHaveProp('importantForAccessibility', 'no-hide-descendants');
    expect(JSON.stringify(toJSON())).toContain(
      theme.art.decor === 'speed-lines' ? 'Line' : 'Circle',
    );
  });
});
