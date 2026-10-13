import { screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { PairDevice } from './pair-device';

const t = strings.pairDevice;

describe('PairDevice', () => {
  it('normalizes the typed code before submitting it', async () => {
    const onSubmitCode = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <PairDevice onSubmitCode={onSubmitCode} submitting={false} error={null} />,
    );

    await user.type(screen.getByLabelText(t.code), 'abc 234');
    await user.press(screen.getByRole('button', { name: t.submit }));

    expect(onSubmitCode).toHaveBeenCalledWith('ABC234');
  });

  it('rejects malformed codes and shows server errors', async () => {
    const onSubmitCode = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <PairDevice onSubmitCode={onSubmitCode} submitting={false} error="invalidPairingCode" />,
    );

    await user.type(screen.getByLabelText(t.code), 'ABC1O4');
    await user.press(screen.getByRole('button', { name: t.submit }));

    expect(onSubmitCode).not.toHaveBeenCalled();
    expect(screen.getByText(t.errors.code)).toBeOnTheScreen();
    expect(screen.getByText(strings.errors.invalidPairingCode)).toBeOnTheScreen();
  });
});
