import { themes, type Theme } from '@math-genius/ui';
import { registerCSS } from 'react-native-css/jest';

import { renderWithTheme } from '@/test-utils/render';
import {
  badLineHeights,
  compileGlobalCss,
  hostStyles,
  nativeCssOptions,
  unreasonableLayoutValues,
} from '@/test-utils/native-styles';

import { Welcome } from './welcome';

const globalCss = compileGlobalCss();

async function renderWelcome(theme: Theme = themes.kawaii) {
  const { toJSON } = await renderWithTheme(
    <Welcome onChooseParent={jest.fn()} onChooseChild={jest.fn()} />,
    theme,
  );
  return hostStyles(toJSON());
}

describe('Welcome with native styles', () => {
  beforeEach(() => {
    registerCSS(globalCss, nativeCssOptions);
  });

  it('resolves spacing and container tokens to reasonable numbers', async () => {
    const styles = await renderWelcome();
    const keys = styles.flatMap(({ style }) => Object.keys(style));

    expect(keys).toEqual(
      expect.arrayContaining(['gap', 'maxWidth', 'paddingInline', 'paddingBlock']),
    );
    expect(unreasonableLayoutValues(styles)).toEqual([]);
  });

  it('gives every text a line height close to its font size', async () => {
    const styles = await renderWelcome();

    expect(styles.some(({ type }) => type === 'Text')).toBe(true);
    expect(badLineHeights(styles)).toEqual([]);
  });

  it('still takes theme colors at runtime', async () => {
    const theme: Theme = {
      ...themes.kawaii,
      colors: { ...themes.kawaii.colors, background: '#102030' },
    };
    const [screen] = await renderWelcome(theme);

    expect(screen?.style.backgroundColor).toBe('#102030');
  });
});
