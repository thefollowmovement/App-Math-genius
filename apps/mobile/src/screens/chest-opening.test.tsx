import { screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { renderWithTheme } from '@/test-utils/render';

import { ChestOpening } from './chest-opening';

jest.mock('@/lib/haptics', () => ({
  haptics: { success: jest.fn(), tick: jest.fn(), soft: jest.fn() },
}));

const t = strings.chest;

describe('ChestOpening', () => {
  it('opens on a touch of the chest or of the button', async () => {
    const onOpen = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <ChestOpening
        kind="rare"
        opened={null}
        opening={false}
        error={null}
        onOpen={onOpen}
        onDone={jest.fn()}
      />,
    );
    expect(screen.getByText(t.rare)).toBeOnTheScreen();
    expect(screen.getByText(t.hint)).toBeOnTheScreen();
    const [chest, button] = screen.getAllByRole('button', { name: t.open });
    if (!chest || !button) throw new Error('Missing buttons');
    await user.press(chest);
    await user.press(button);
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(haptics.success).not.toHaveBeenCalled();
  });

  it('reveals the gems with a success buzz, then goes back', async () => {
    const onDone = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <ChestOpening
        kind="common"
        opened={{ kind: 'common', gems: 12, total: 57 }}
        opening={false}
        error={null}
        onOpen={jest.fn()}
        onDone={onDone}
      />,
    );
    expect(screen.getByText(t.found(12))).toBeOnTheScreen();
    expect(screen.getByText(t.total(57))).toBeOnTheScreen();
    expect(haptics.success).toHaveBeenCalledTimes(1);
    await user.press(screen.getByRole('button', { name: t.done }));
    expect(onDone).toHaveBeenCalled();
  });
});
