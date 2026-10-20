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
  savedOutfit: null,
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
    // A card per slot. Auras: the free one, the one of a badge earned, and the locked ones.
    for (const slot of ['aura', 'frame', 'companion', 'accessory'] as const) {
      expect(screen.getByLabelText(t.slots[slot])).toBeOnTheScreen();
    }
    await user.press(screen.getByRole('radio', { name: t.cosmetics['aura-gold'] }));
    expect(onCosmetic).toHaveBeenCalledWith('aura', 'aura-gold');
    expect(
      screen.getByRole('radio', { name: t.lockedLabel(t.cosmetics['aura-cyan']) }),
    ).toBeOnTheScreen();

    expect(screen.getByRole('radio', { name: t.cosmetics['frame-neon'] })).toBeChecked();
    await user.press(screen.getByRole('radio', { name: t.noneLabel(t.slots.frame) }));
    expect(onCosmetic).toHaveBeenCalledWith('frame', null);

    // Companions on cards: Baekho comes with 7 days of streak, Draco from the shop.
    const c = strings.companions;
    await user.press(screen.getByRole('radio', { name: c.cardLabel('Baekho', 'Épique') }));
    expect(onCosmetic).toHaveBeenCalledWith('companion', 'tigre');
    expect(screen.getByRole('radio', { name: t.lockedLabel('Draco') })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: t.noneLabel(t.slots.companion) })).toBeChecked();
  });

  it('shows the sheet of the companion worn, or of the one just tried', async () => {
    const c = strings.companions;
    const { rerender } = await renderWithTheme(
      <LookEditor
        {...props}
        look={{ ...props.look, avatar: { ...props.look.avatar, wear: { companion: 'hibou' } } }}
        unlocked={{ badges: new Set(['first-exercise']), owned: new Set() }}
      />,
    );
    expect(
      screen.getByRole('radio', { name: c.cardLabel('Chouette Galactique', 'Commun') }),
    ).toBeChecked();
    expect(screen.getByText(c.items.hibou.fullName)).toBeOnTheScreen();
    expect(screen.getByText(c.items.hibou.specialty)).toBeOnTheScreen();

    await rerender(
      <LookEditor
        {...props}
        look={{ ...props.look, avatar: { ...props.look.avatar, wear: { companion: 'hibou' } } }}
        unlocked={{ badges: new Set(['first-exercise']), owned: new Set() }}
        hint={{ cosmetic: 'phenix', missing: { kind: 'badge', badge: 'level-10' } }}
      />,
    );
    expect(screen.getByText(c.items.phenix.fullName)).toBeOnTheScreen();
    expect(screen.getByLabelText(c.rarityLabel('Légendaire'))).toBeOnTheScreen();
    expect(
      screen.getByText(t.lockedBadge('Phénix', strings.badges.items['level-10'].title)),
    ).toBeOnTheScreen();
  });

  it('dresses the hero in an outfit, and previews one before it is unlocked', async () => {
    const o = strings.outfits;
    const onCosmetic = jest.fn();
    const user = userEvent.setup();
    const sporty = { ...look, avatar: { hero: 'nova', wear: { outfit: 'sport' } } } as const;
    const { rerender } = await renderWithTheme(
      <LookEditor
        {...props}
        look={sporty}
        savedOutfit="sport"
        unlocked={{ badges: new Set(), owned: new Set(['sport']) }}
        onCosmetic={onCosmetic}
      />,
    );
    // The portrait and the preview show Nova in her sports outfit.
    expect(
      screen.getByRole('image', { name: strings.heroes.portrait('Nova', [], o.items.sport.worn) }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('image', { name: o.previewLabel('Nova', o.items.sport.worn) }),
    ).toBeOnTheScreen();
    expect(screen.getByText(o.worn)).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: o.items.sport.name })).toBeChecked();
    // The stage outfit is always there; Magie is bought, the astronaut earned with an island.
    await user.press(screen.getByRole('radio', { name: o.stage.name }));
    expect(onCosmetic).toHaveBeenCalledWith('outfit', null);
    await user.press(screen.getByRole('radio', { name: t.lockedLabel(o.items.astronaute.name) }));
    expect(onCosmetic).toHaveBeenCalledWith('outfit', 'astronaute');
    expect(
      screen.getByRole('radio', { name: t.lockedLabel(o.items.magie.name) }),
    ).toBeOnTheScreen();

    // Tried before it is unlocked: the hero wears it in the preview, which says what it waits for.
    await rerender(
      <LookEditor
        {...props}
        look={sporty}
        savedOutfit="sport"
        unlocked={{ badges: new Set(), owned: new Set(['sport']) }}
        hint={{ cosmetic: 'astronaute', missing: { kind: 'badge', badge: 'island-1' } }}
      />,
    );
    expect(
      screen.getByRole('image', { name: o.previewLabel('Nova', o.items.astronaute.worn) }),
    ).toBeOnTheScreen();
    const reason = t.lockedBadge(o.items.astronaute.name, strings.badges.items['island-1'].title);
    // Once, on the preview.
    expect(screen.getAllByText(reason)).toHaveLength(1);
    // The saved look keeps the sports outfit.
    expect(
      screen.getByRole('image', { name: strings.heroes.portrait('Nova', [], o.items.sport.worn) }),
    ).toBeOnTheScreen();

    // Picked once unlocked, it is the hero's outfit only once saved.
    await rerender(
      <LookEditor
        {...props}
        look={{ ...look, avatar: { hero: 'nova', wear: { outfit: 'astronaute' } } }}
        savedOutfit="sport"
        unlocked={{ badges: new Set(['island-1']), owned: new Set(['sport']) }}
      />,
    );
    expect(screen.getByText(o.toSave)).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: o.items.astronaute.name })).toBeChecked();
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
        hint={{ cosmetic: 'renard', missing: { kind: 'shop', item: 'renard' } }}
      />,
    );
    expect(screen.getByText(t.lockedShop('Kitsune', 250))).toBeOnTheScreen();
  });
});
