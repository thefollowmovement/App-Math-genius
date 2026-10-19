import { DEFAULT_LOOKS } from '@math-genius/shared';
import { ThemedText, themes, type Theme } from '@math-genius/ui';
import type { ReactElement } from 'react';
import { registerCSS } from 'react-native-css/jest';

import type { Child } from '@/data/children';
import { renderWithTheme } from '@/test-utils/render';
import { compileGlobalCss, hostStyles, nativeCssOptions } from '@/test-utils/native-styles';
import { award, rewards } from '@/test-utils/rewards';

import { ChildHome } from './child-home';
import { LookEditor } from './look';
import { SessionSummary } from './session-summary';

const globalCss = compileGlobalCss();

const lea: Child = {
  id: 'lea',
  display_name: 'Léa',
  gender: 'girl',
  grade: 'CE2',
  birth_year: null,
  theme_id: 'kawaii',
  avatar: {},
};

const COLOR_KEYS = /^(color|backgroundColor|border\w*Color|tintColor)$/;

/** Colors drawn by the host views that are not among `palette`. */
function foreignColors(tree: unknown, palette: string[]): string[] {
  // Tailwind writes `transparent` as #0000.
  const known = new Set([...palette.map((color) => color.toLowerCase()), 'transparent', '#0000']);
  return hostStyles(tree).flatMap(({ style }) =>
    Object.entries(style)
      .filter(([key]) => COLOR_KEYS.test(key))
      .map(([, value]) => String(value).toLowerCase())
      .filter((color) => !known.has(color)),
  );
}

const palette = (theme: Theme) => Object.values(theme.colors);

const childScreens: { name: string; render: () => ReactElement }[] = [
  {
    name: 'ChildHome',
    render: () => (
      <ChildHome
        child={lea}
        practice={{ status: 'ready' }}
        plan="planned"
        goal={{ type: 'count', count: 10 }}
        rewards={rewards([{ id: 'chest-1', kind: 'rare' }])}
        onOpenChest={jest.fn()}
        onOpenMap={jest.fn()}
        onOpenLook={jest.fn()}
        sync="offline"
        onStart={jest.fn()}
      />
    ),
  },
  {
    name: 'SessionSummary',
    render: () => (
      <SessionSummary
        summary={{
          kind: 'daily',
          goalMet: true,
          answered: 10,
          correct: 9,
          minutes: 15,
          progressed: [],
        }}
        saved
        award={{ status: 'ready', award: award() }}
        onOpenChest={jest.fn()}
        onOpenBadges={jest.fn()}
        onBonus={jest.fn()}
        onHome={jest.fn()}
      />
    ),
  },
];

// Changing theme needs no screen code: the same classes resolve to each theme's tokens.
describe.each(Object.values(themes))('theme $id with native styles', (theme) => {
  beforeEach(() => {
    registerCSS(globalCss, nativeCssOptions);
  });

  it('draws titles in its own font, with the weight of the font file', async () => {
    const { toJSON } = await renderWithTheme(
      <ThemedText variant="display">Bonjour</ThemedText>,
      theme,
    );
    const [text] = hostStyles(toJSON());
    expect(text?.style).toMatchObject({
      fontFamily: theme.typography.headingFont,
      fontWeight: theme.typography.headingWeight,
      color: theme.colors.foreground,
    });
  });

  it('keeps body text on the system font', async () => {
    const { toJSON } = await renderWithTheme(<ThemedText>Bonjour</ThemedText>, theme);
    const [text] = hostStyles(toJSON());
    expect(text?.style.fontFamily).toBeUndefined();
    expect(text?.style.color).toBe(theme.colors.foreground);
  });

  it.each(childScreens)('draws $name in its colors only', async ({ render }) => {
    const { toJSON } = await renderWithTheme(render(), theme);
    const styles = hostStyles(toJSON());
    expect(styles.some(({ style }) => style.backgroundColor === theme.colors.background)).toBe(
      true,
    );
    expect(foreignColors(toJSON(), palette(theme))).toEqual([]);
  });

  it('previews itself in the look editor, each theme card in its own colors', async () => {
    const look = { theme: theme.id as keyof typeof themes, avatar: DEFAULT_LOOKS.girl.avatar };
    const { toJSON } = await renderWithTheme(
      <LookEditor
        look={look}
        changed={false}
        saving={false}
        error={null}
        onTheme={jest.fn()}
        onSave={jest.fn()}
      />,
      theme,
    );
    const [page] = hostStyles(toJSON());
    expect(page?.style.backgroundColor).toBe(theme.colors.background);
    expect(foreignColors(toJSON(), Object.values(themes).flatMap(palette))).toEqual([]);
  });
});
