import { DEFAULT_LOOKS } from '@math-genius/shared';
import { themes } from '@math-genius/ui';
import { screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { LookEditor } from '.';

const t = strings.look;
const look = { theme: 'manga', avatar: DEFAULT_LOOKS.girl.avatar } as const;
const label = (id: keyof typeof strings.themes) =>
  t.themeLabel(strings.themes[id].name, strings.themes[id].description);
const hero = (id: keyof typeof strings.heroes.items) =>
  strings.heroes.label(strings.heroes.items[id].name, strings.heroes.items[id].role);
const props = {
  look,
  unlocked: { badges: new Set<string>(), owned: new Set<string>() },
  hint: null,
  changed: false,
  saving: false,
  error: null,
  onHero: jest.fn(),
  onCosmetic: jest.fn(),
  onTheme: jest.fn(),
  onSave: jest.fn(),
};

describe('LookEditor', () => {
  it('offers every theme and previews the one picked', async () => {
    const onTheme = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(<LookEditor {...props} onTheme={onTheme} />, themes.manga);
    expect(screen.getByRole('radio', { name: label('manga') })).toBeChecked();
    expect(screen.getByRole('radio', { name: label('neon') })).not.toBeChecked();
    await user.press(screen.getByRole('radio', { name: label('space') }));
    expect(onTheme).toHaveBeenCalledWith('space');
    // Nothing to save yet.
    expect(screen.getByRole('button', { name: t.save })).toBeDisabled();
  });

  it('offers the six heroes', async () => {
    const onHero = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(<LookEditor {...props} onHero={onHero} />);
    expect(screen.getByRole('image', { name: strings.heroes.portrait('Nova') })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: hero('nova') })).toBeChecked();
    for (const id of ['juno', 'mika', 'kai', 'taro', 'leo'] as const) {
      expect(screen.getByRole('radio', { name: hero(id) })).not.toBeChecked();
    }
    await user.press(screen.getByRole('radio', { name: hero('leo') }));
    expect(onHero).toHaveBeenCalledWith('leo');
  });

  it('dresses the hero slot by slot, and locks what is not unlocked', async () => {
    const onCosmetic = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <LookEditor
        {...props}
        unlocked={{ badges: new Set(['streak-7']), owned: new Set() }}
        onCosmetic={onCosmetic}
      />,
    );
    // Auras first: the free one, the one of a badge earned, and the locked ones.
    expect(screen.getByRole('tab', { name: t.slots.aura })).toBeSelected();
    await user.press(screen.getByRole('radio', { name: t.cosmetics['aura-gold'] }));
    expect(onCosmetic).toHaveBeenCalledWith('aura', 'aura-gold');
    expect(
      screen.getByRole('radio', { name: t.lockedLabel(t.cosmetics['aura-cyan']) }),
    ).toBeOnTheScreen();

    await user.press(screen.getByRole('tab', { name: t.slots.frame }));
    expect(screen.getByRole('radio', { name: t.cosmetics['frame-neon'] })).toBeChecked();
    await user.press(screen.getByRole('radio', { name: t.noneLabel(t.slots.frame) }));
    expect(onCosmetic).toHaveBeenCalledWith('frame', null);

    await user.press(screen.getByRole('tab', { name: t.slots.companion }));
    const kitten = strings.shop.items.kitten.name;
    expect(screen.getByRole('radio', { name: t.lockedLabel(kitten) })).toBeOnTheScreen();
  });

  it('says what a locked cosmetic waits for, and why saving failed', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    const { rerender } = await renderWithTheme(
      <LookEditor
        {...props}
        changed
        error="avatarLocked"
        hint={{ cosmetic: 'aura-cyan', missing: { kind: 'badge', badge: 'streak-3' } }}
        onSave={onSave}
      />,
    );
    expect(
      screen.getByText(
        t.lockedBadge(t.cosmetics['aura-cyan'], strings.badges.items['streak-3'].title),
      ),
    ).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.save }));
    expect(onSave).toHaveBeenCalled();
    expect(screen.getByText(strings.errors.avatarLocked)).toBeOnTheScreen();

    await rerender(
      <LookEditor
        {...props}
        hint={{ cosmetic: 'kitten', missing: { kind: 'shop', item: 'kitten' } }}
      />,
    );
    expect(screen.getByText(t.lockedShop(strings.shop.items.kitten.name, 60))).toBeOnTheScreen();
  });
});
