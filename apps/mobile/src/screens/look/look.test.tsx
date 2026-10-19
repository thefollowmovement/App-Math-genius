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

describe('LookEditor', () => {
  it('offers every theme and previews the one picked', async () => {
    const onTheme = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <LookEditor
        look={look}
        changed={false}
        saving={false}
        error={null}
        onTheme={onTheme}
        onSave={jest.fn()}
      />,
      themes.manga,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(Object.keys(themes).length);
    expect(screen.getByRole('radio', { name: label('manga') })).toBeChecked();
    expect(screen.getByRole('radio', { name: label('space') })).not.toBeChecked();
    await user.press(screen.getByRole('radio', { name: label('space') }));
    expect(onTheme).toHaveBeenCalledWith('space');
    // Nothing to save yet.
    expect(screen.getByRole('button', { name: t.save })).toBeDisabled();
  });

  it('saves a new look, and says why it could not', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <LookEditor
        look={look}
        changed
        saving={false}
        error="network"
        onTheme={jest.fn()}
        onSave={onSave}
      />,
    );
    await user.press(screen.getByRole('button', { name: t.save }));
    expect(onSave).toHaveBeenCalled();
    expect(screen.getByText(strings.errors.network)).toBeOnTheScreen();
  });
});
