import { render, screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/i18n';

import { Welcome } from './welcome';

describe('Welcome', () => {
  it('lets the user say whether they are a parent or a child', async () => {
    const onChooseParent = jest.fn();
    const onChooseChild = jest.fn();
    const user = userEvent.setup();

    await render(<Welcome onChooseParent={onChooseParent} onChooseChild={onChooseChild} />);

    await user.press(screen.getByRole('button', { name: strings.welcome.parent }));
    expect(onChooseParent).toHaveBeenCalledTimes(1);

    await user.press(screen.getByRole('button', { name: strings.welcome.child }));
    expect(onChooseChild).toHaveBeenCalledTimes(1);
  });
});
