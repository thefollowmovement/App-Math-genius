import { screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { MascotIntro } from './mascot-intro';

const t = strings.intro;

describe('MascotIntro', () => {
  it('introduces the mascot in three steps, then offers to make the avatar', async () => {
    const onMakeAvatar = jest.fn();
    const onLater = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <MascotIntro childName="Léa" onMakeAvatar={onMakeAvatar} onLater={onLater} />,
    );
    expect(screen.getByRole('header', { name: 'Salut Léa !' })).toBeOnTheScreen();
    expect(screen.getByText(/Moi, c’est Mimo/)).toBeOnTheScreen();
    expect(screen.getByLabelText(t.progress(1, 3))).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: t.next }));
    expect(screen.getByRole('header', { name: 'Une mission par jour' })).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.next }));
    expect(screen.getByLabelText(t.progress(3, 3))).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: t.next })).toBeNull();

    await user.press(screen.getByRole('button', { name: t.later }));
    expect(onLater).toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: t.makeAvatar }));
    expect(onMakeAvatar).toHaveBeenCalled();
  });
});
