import { screen, userEvent, within } from '@testing-library/react-native';

import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { ChildForm } from '.';

const t = strings.childForm;

describe('ChildForm', () => {
  it('asks for a name, a gender and a grade', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <ChildForm onSubmit={onSubmit} submitting={false} error={null} currentYear={2026} />,
    );

    await user.press(screen.getByRole('button', { name: t.submit }));

    expect(screen.getByText(t.errors.displayName)).toBeOnTheScreen();
    expect(screen.getByText(t.errors.gender)).toBeOnTheScreen();
    expect(screen.getByText(t.errors.grade)).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the profile, birth year optional', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <ChildForm onSubmit={onSubmit} submitting={false} error={null} currentYear={2026} />,
    );

    await user.type(screen.getByLabelText(t.displayName), 'Léa');
    await user.press(within(screen.getByTestId('gender')).getByRole('radio', { name: 'Fille' }));
    await user.press(within(screen.getByTestId('grade')).getByRole('radio', { name: 'CE2' }));
    await user.press(screen.getByRole('button', { name: t.submit }));

    expect(onSubmit).toHaveBeenCalledWith({
      displayName: 'Léa',
      gender: 'girl',
      grade: 'CE2',
      birthYear: null,
    });
  });
});
