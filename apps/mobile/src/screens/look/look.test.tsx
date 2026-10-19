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
const props = {
  look,
  earned: new Set<string>(),
  hint: null,
  changed: false,
  saving: false,
  error: null,
  onPart: jest.fn(),
  onTheme: jest.fn(),
  onSave: jest.fn(),
};

describe('LookEditor', () => {
  it('offers every theme and previews the one picked', async () => {
    const onTheme = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(<LookEditor {...props} onTheme={onTheme} />, themes.manga);
    expect(screen.getByRole('radio', { name: label('manga') })).toBeChecked();
    expect(screen.getByRole('radio', { name: label('space') })).not.toBeChecked();
    await user.press(screen.getByRole('radio', { name: label('space') }));
    expect(onTheme).toHaveBeenCalledWith('space');
    // Nothing to save yet.
    expect(screen.getByRole('button', { name: t.save })).toBeDisabled();
  });

  it('dresses the avatar part by part', async () => {
    const onPart = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(<LookEditor {...props} onPart={onPart} />);
    expect(screen.getByRole('image', { name: t.avatar })).toBeOnTheScreen();
    // Hair first.
    expect(screen.getByRole('tab', { name: t.parts.hair })).toBeSelected();
    expect(screen.getByRole('radio', { name: t.options.hair.long })).toBeChecked();
    await user.press(screen.getByRole('radio', { name: t.options.hair.bun }));
    expect(onPart).toHaveBeenCalledWith('hair', 'bun');

    await user.press(screen.getByRole('tab', { name: t.parts.skin }));
    expect(screen.getAllByRole('radio', { name: /^Peau/ })).toHaveLength(6);
    await user.press(screen.getByRole('radio', { name: t.options.skin['skin-5'] }));
    expect(onPart).toHaveBeenCalledWith('skin', 'skin-5');
  });

  it('shows which badge opens a rare option', async () => {
    const cape = t.options.outfit.cape;
    const streak = strings.badges.items['streak-7'].title;
    const { rerender } = await renderWithTheme(<LookEditor {...props} />);
    await userEvent.setup().press(screen.getByRole('tab', { name: t.parts.outfit }));
    expect(screen.getByRole('radio', { name: t.lockedLabel(cape, streak) })).toBeOnTheScreen();

    await rerender(
      <LookEditor {...props} hint={{ part: 'outfit', option: 'cape', badge: 'streak-7' }} />,
    );
    expect(screen.getByText(t.locked(cape, streak))).toBeOnTheScreen();

    await rerender(<LookEditor {...props} earned={new Set(['streak-7'])} />);
    expect(screen.getByRole('radio', { name: cape })).toBeOnTheScreen();
  });

  it('saves a new look, and says why it could not', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <LookEditor {...props} accessory="crown" changed error="avatarLocked" onSave={onSave} />,
    );
    expect(
      screen.getByRole('image', { name: t.avatarWith(strings.shop.items.crown.name) }),
    ).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.save }));
    expect(onSave).toHaveBeenCalled();
    expect(screen.getByText(strings.errors.avatarLocked)).toBeOnTheScreen();
  });
});
