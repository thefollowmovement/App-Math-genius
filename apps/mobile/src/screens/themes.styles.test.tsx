import { DEFAULT_LOOKS } from '@math-genius/shared';
import { Button, ThemedText, themes, type Theme } from '@math-genius/ui';
import type { ReactElement } from 'react';
import { registerCSS } from 'react-native-css/jest';

import type { Child } from '@/data/children';
import { renderWithTheme } from '@/test-utils/render';
import { compileGlobalCss, hostStyles, nativeCssOptions } from '@/test-utils/native-styles';
import { award, rewards } from '@/test-utils/rewards';

import { worldMap } from '@math-genius/exercise-engine';

import { exerciseOfType } from '@/test-utils/exercises';

import { ChildHome } from './child-home';
import { PracticeScreen } from './practice';
import { WorldMap } from './world-map';
import { LookEditor } from './look';
import { HeroIntro } from './hero-intro';
import { PlacementScreen } from './placement';
import { PlacementIntro } from './placement/placement-intro';
import { PlacementResult } from './placement/placement-result';
import { currentStop } from '@/data/mission-model';
import { questionsFor } from '@/data/universe-model';
import { catalogue } from '@/test-utils/universes';
import { SessionSummary } from './session-summary';
import { UniverseQuestionnaire } from './universe';

const globalCss = compileGlobalCss();

const lea: Child = {
  id: 'lea',
  display_name: 'Léa',
  gender: 'girl',
  grade: 'CE2',
  birth_year: null,
  theme_id: 'kawaii',
  avatar: {},
  personalization_consent_at: null,
  universe_asked_at: null,
};

const COLOR_KEYS = /^(color|backgroundColor|border\w*Color|tintColor)$/;

/** A theme color made translucent (`bg-primary/15`) is still the theme's: its #RRGGBB. */
function opaque(color: string): string {
  const rgba = /^rgba\((\d+), (\d+), (\d+), [\d.]+\)$/.exec(color);
  if (!rgba) return color;
  const hex = rgba.slice(1).map((channel) => Number(channel).toString(16).padStart(2, '0'));
  return `#${hex.join('')}`;
}

/** Colors drawn by the host views that are not among `palette`. */
function foreignColors(tree: unknown, palette: string[]): string[] {
  // Tailwind writes `transparent` as #0000.
  const known = new Set([...palette.map((color) => color.toLowerCase()), 'transparent', '#0000']);
  return hostStyles(tree).flatMap(({ style }) =>
    Object.entries(style)
      .filter(([key]) => COLOR_KEYS.test(key))
      .map(([, value]) => opaque(String(value).toLowerCase()))
      .filter((color) => !known.has(color)),
  );
}

// The interface's colors, and the buttons' relief.
const palette = (theme: Theme) => [...Object.values(theme.colors), theme.relief.color];

const childScreens: { name: string; render: () => ReactElement }[] = [
  {
    name: 'ChildHome',
    render: () => (
      <ChildHome
        child={lea}
        practice={{ status: 'ready' }}
        plan={{ kind: 'planned', start: 17 * 60, deadline: 18 * 60 }}
        goal={{ type: 'count', count: 10 }}
        rewards={rewards([{ id: 'chest-1', kind: 'rare' }])}
        onOpenChest={jest.fn()}
        onOpenMap={jest.fn()}
        onOpenLook={jest.fn()}
        universe="first"
        onOpenUniverse={jest.fn()}
        superPower={{ kind: 'mental_speed' }}
        sync="offline"
        onStart={jest.fn()}
      />
    ),
  },
  {
    name: 'ChildHome (recap card)',
    render: () => (
      <ChildHome
        child={lea}
        practice={{ status: 'done' }}
        plan={{ kind: 'planned', start: 17 * 60, deadline: 18 * 60 }}
        goal={{ type: 'count', count: 10 }}
        highlights={{
          kind: 'week',
          from: '2026-09-21',
          to: '2026-09-27',
          days: 4,
          correct: 36,
          xp: 380,
          learned: 1,
          badges: 1,
        }}
        onCloseHighlights={jest.fn()}
        sync="idle"
        onStart={jest.fn()}
      />
    ),
  },
  {
    name: 'UniverseQuestionnaire',
    render: () => (
      <UniverseQuestionnaire
        childName="Léa"
        mode="edit"
        questions={questionsFor(catalogue, '5e')}
        initial={{ games: { universes: ['minecraft'], other: '' } }}
        saving={false}
        saved={false}
        error={null}
        onSave={jest.fn()}
        onLater={jest.fn()}
        onContinue={jest.fn()}
      />
    ),
  },
  {
    name: 'PracticeScreen',
    render: () => (
      <PracticeScreen
        exercise={exerciseOfType('choice')}
        slot="automatism"
        twin
        reminder={false}
        progress={0.4}
        count={{ done: 6, total: 15, unit: 'exercises' }}
        combo={3}
        hintShown
        notice={null}
        feedback={null}
        onShowHint={jest.fn()}
        onSubmit={jest.fn()}
        onContinue={jest.fn()}
        onPause={jest.fn()}
      />
    ),
  },
  {
    name: 'PracticeScreen (the coach explains)',
    render: () => (
      <PracticeScreen
        exercise={exerciseOfType('numeric')}
        slot="current"
        twin={false}
        reminder={false}
        progress={0.4}
        count={{ done: 6, total: 15, unit: 'exercises' }}
        combo={0}
        hintShown={false}
        notice={null}
        feedback={{
          response: { type: 'numeric', text: '1' },
          correct: false,
          fast: false,
          finished: false,
        }}
        coach={{
          status: 'shown',
          more: true,
          explanation: { what: 'Ce qui s’est passé.', image: 'Imagine.', tip: 'L’astuce.' },
        }}
        onShowHint={jest.fn()}
        onSubmit={jest.fn()}
        onContinue={jest.fn()}
        onUnderstood={jest.fn()}
        onExplainAgain={jest.fn()}
        onPause={jest.fn()}
      />
    ),
  },
  {
    name: 'WorldMap',
    render: () => (
      <WorldMap
        islands={worldMap({ grade: 'CM1', mastery: {}, at: '2026-10-19T17:00:00Z', defeated: [] })}
        busy={false}
        onFightBoss={jest.fn()}
      />
    ),
  },
  {
    name: 'PlacementIntro',
    render: () => (
      <PlacementIntro childName="Léa" recheck onStart={jest.fn()} onLater={jest.fn()} />
    ),
  },
  {
    name: 'PlacementScreen',
    render: () => (
      <PlacementScreen
        exercise={exerciseOfType('choice')}
        progress={0.6}
        recheck={false}
        notice={null}
        onSubmit={jest.fn()}
        onSkip={jest.fn()}
        onPause={jest.fn()}
      />
    ),
  },
  {
    name: 'PlacementResult',
    render: () => {
      const islands = worldMap({
        grade: 'CM1',
        mastery: {},
        at: '2026-10-20T17:00:00Z',
        defeated: [],
      });
      return (
        <PlacementResult
          islands={islands}
          stop={currentStop(islands)}
          onPlay={jest.fn()}
          onOpenMap={jest.fn()}
          onHome={jest.fn()}
        />
      );
    },
  },
  {
    name: 'HeroIntro',
    render: () => (
      <HeroIntro
        childName="Léa"
        step={0}
        hero="taro"
        outfit={null}
        saving={false}
        error={null}
        onPickHero={jest.fn()}
        onConfirmHero={jest.fn()}
        onNext={jest.fn()}
        onStart={jest.fn()}
        onCustomize={jest.fn()}
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

  it('writes body texts in its body font, or the system font', async () => {
    const texts = async (ui: ReactElement) =>
      hostStyles((await renderWithTheme(ui, theme)).toJSON());
    const [body] = await texts(<ThemedText>Bonjour</ThemedText>);
    const [headline] = await texts(<ThemedText variant="headline">Bonjour</ThemedText>);
    const font = theme.typography.bodyFont;
    expect(body?.style.fontFamily).toBe(font?.regular);
    // The semibold file, with the weight it holds.
    expect(headline?.style.fontFamily).toBe(font?.semibold);
    expect(String(headline?.style.fontWeight)).toBe('600');
    // An exercise's statement: large, never in the arcade or comic font of titles.
    const [statement] = await texts(<ThemedText variant="statement">Place 1/4</ThemedText>);
    expect(statement?.style.fontFamily).toBe(font?.semibold);
    expect(String(statement?.style.fontWeight)).toBe('600');
    expect(statement?.style.fontSize).toBeGreaterThan(Number(body?.style.fontSize));
    expect(body?.style.color).toBe(theme.colors.foreground);
  });

  it('gives filled buttons its relief', async () => {
    const { toJSON } = await renderWithTheme(<Button title="Go" />, theme);
    const [button] = hostStyles(toJSON());
    expect(button?.style).toMatchObject({
      borderBottomWidth: theme.relief.depth,
      borderBottomColor: theme.relief.color,
    });
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
        savedOutfit={null}
        look={look}
        unlocked={{ badges: new Set(), owned: new Set() }}
        hint={null}
        onHero={jest.fn()}
        onCosmetic={jest.fn()}
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
