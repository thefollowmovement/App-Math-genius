import { screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { HeroIntro } from './hero-intro';

const t = strings.intro;
const callbacks = () => ({
  onPickHero: jest.fn(),
  onConfirmHero: jest.fn(),
  onNext: jest.fn(),
  onStart: jest.fn(),
  onCustomize: jest.fn(),
});

describe('HeroIntro', () => {
  it('starts with « Choisis ton héros »', async () => {
    const props = callbacks();
    const user = userEvent.setup();
    await renderWithTheme(
      <HeroIntro {...props} childName="Léa" step={0} hero="nova" saving={false} error="network" />,
    );
    expect(screen.getByRole('header', { name: t.choose.title })).toBeOnTheScreen();
    expect(screen.getByLabelText(t.progress(1, 4))).toBeOnTheScreen();
    const juno = strings.heroes.items.juno;
    await user.press(
      screen.getByRole('radio', { name: strings.heroes.label(juno.name, juno.role) }),
    );
    expect(props.onPickHero).toHaveBeenCalledWith('juno');
    await user.press(screen.getByRole('button', { name: t.choose.confirmLabel('Nova') }));
    expect(props.onConfirmHero).toHaveBeenCalled();
    // Offline, the child tries again.
    expect(screen.getByText(strings.errors.network)).toBeOnTheScreen();
  });

  it('lets the chosen hero present the app, then offers to dress it', async () => {
    const props = callbacks();
    const user = userEvent.setup();
    const { rerender } = await renderWithTheme(
      <HeroIntro {...props} childName="Léa" step={1} hero="kai" saving={false} error={null} />,
    );
    expect(screen.getByRole('header', { name: 'Salut Léa !' })).toBeOnTheScreen();
    expect(screen.getByText(/Moi, c’est Kai/)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.next }));
    expect(props.onNext).toHaveBeenCalled();

    await rerender(
      <HeroIntro {...props} childName="Léa" step={3} hero="kai" saving={false} error={null} />,
    );
    expect(screen.getByLabelText(t.progress(4, 4))).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: t.next })).toBeNull();
    await user.press(screen.getByRole('button', { name: t.customize }));
    expect(props.onCustomize).toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: t.start }));
    expect(props.onStart).toHaveBeenCalled();
  });
});
