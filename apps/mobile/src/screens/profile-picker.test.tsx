import { screen, userEvent } from '@testing-library/react-native';

import type { Child } from '@/data/children';
import { renderWithTheme } from '@/test-utils/render';

import { ProfilePicker } from './profile-picker';

const lea: Child = {
  id: 'lea',
  display_name: 'Léa',
  gender: 'girl',
  grade: 'CE2',
  birth_year: null,
  theme_id: 'kawaii',
  avatar: {},
};

describe('ProfilePicker', () => {
  it('opens the chosen profile', async () => {
    const onPick = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <ProfilePicker
        childProfiles={[lea, { ...lea, id: 'tom', display_name: 'Tom' }]}
        onPick={onPick}
      />,
    );

    await user.press(screen.getByRole('button', { name: 'Tom' }));

    expect(onPick).toHaveBeenCalledWith('tom');
  });
});
