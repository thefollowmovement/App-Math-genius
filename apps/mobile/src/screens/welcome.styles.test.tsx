import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import { ThemeProvider, themes, type Theme } from '@math-genius/ui';
import { render } from '@testing-library/react-native';
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { registerCSS } from 'react-native-css/jest';

import { Welcome } from './welcome';

// Same compiler options as metro.config.js.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nativeCssOptions = require('../../native-css.config');

type Style = ViewStyle & TextStyle;
type HostNode = {
  type: string;
  props: { style?: Style | Style[] };
  children: (HostNode | string)[] | null;
};

// Tailwind runs in its own Node process, as it does under Metro.
const compileTailwind = join(__dirname, '../../scripts/compile-tailwind.mjs');
const globalCss = execFileSync(process.execPath, [compileTailwind], { encoding: 'utf8' });

const LAYOUT_KEYS = /^(gap|rowGap|columnGap|padding\w*|margin\w*|maxWidth|minWidth|borderRadius)$/;

function hostStyles(node: HostNode | HostNode[] | null): { type: string; style: Style }[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(hostStyles);
  const children = (node.children ?? []).filter(
    (child): child is HostNode => typeof child !== 'string',
  );
  return [
    { type: node.type, style: StyleSheet.flatten(node.props.style) ?? {} },
    ...hostStyles(children),
  ];
}

async function renderWelcome(theme: Theme) {
  const { toJSON } = await render(
    <ThemeProvider theme={theme}>
      <Welcome onChooseParent={jest.fn()} onChooseChild={jest.fn()} />
    </ThemeProvider>,
  );
  return hostStyles(toJSON() as HostNode | HostNode[] | null);
}

describe('Welcome with native styles', () => {
  beforeEach(() => {
    registerCSS(globalCss, nativeCssOptions);
  });

  it('resolves spacing and container tokens to reasonable numbers', async () => {
    const styles = await renderWelcome(themes.kawaii);
    const layout = styles.flatMap(({ style }) =>
      Object.entries(style).filter(([key]) => LAYOUT_KEYS.test(key)),
    );

    expect(layout.map(([key]) => key)).toEqual(
      expect.arrayContaining(['gap', 'maxWidth', 'paddingInline', 'paddingBlock']),
    );
    for (const [key, value] of layout) {
      expect({ [key]: typeof value }).toEqual({ [key]: 'number' });
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(500);
    }
  });

  it('gives every text a line height close to its font size', async () => {
    const texts = (await renderWelcome(themes.kawaii)).filter(({ type }) => type === 'Text');

    expect(texts.length).toBeGreaterThan(0);
    for (const { style } of texts) {
      expect(typeof style.fontSize).toBe('number');
      expect(typeof style.lineHeight).toBe('number');
      expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize ?? Infinity);
      expect(style.lineHeight).toBeLessThanOrEqual((style.fontSize ?? 0) * 2);
    }
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
