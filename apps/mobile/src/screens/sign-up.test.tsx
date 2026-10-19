import { screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { SignUp } from './sign-up';

const t = strings.signUp;

async function renderSignUp() {
  const onSubmit = jest.fn();
  const user = userEvent.setup();
  await renderWithTheme(
    <SignUp onSubmit={onSubmit} submitting={false} error={null} onGoToSignIn={jest.fn()} />,
  );
  return { onSubmit, user };
}

describe('SignUp', () => {
  it('explains each invalid field and does not submit', async () => {
    const { onSubmit, user } = await renderSignUp();

    await user.press(screen.getByRole('button', { name: t.submit }));

    expect(screen.getByText(t.errors.displayName)).toBeOnTheScreen();
    expect(screen.getByText(t.errors.email)).toBeOnTheScreen();
    expect(screen.getByText(t.errors.password)).toBeOnTheScreen();
    expect(screen.getByText(t.errors.acceptsPrivacyPolicy)).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("hides a field's error as soon as it is edited", async () => {
    const { user } = await renderSignUp();

    await user.press(screen.getByRole('button', { name: t.submit }));
    await user.type(screen.getByLabelText(t.displayName), 'C');

    expect(screen.queryByText(t.errors.displayName)).not.toBeOnTheScreen();
    expect(screen.getByText(t.errors.email)).toBeOnTheScreen();
  });

  it('submits once the parent consents', async () => {
    const { onSubmit, user } = await renderSignUp();

    await user.type(screen.getByLabelText(t.displayName), ' Camille ');
    await user.type(screen.getByLabelText(t.email), 'camille@example.com');
    await user.type(screen.getByLabelText(t.password), 'motdepasse');
    await user.press(screen.getByRole('button', { name: t.submit }));
    expect(onSubmit).not.toHaveBeenCalled();

    await user.press(screen.getByRole('checkbox', { name: t.consent }));
    await user.press(screen.getByRole('button', { name: t.submit }));

    expect(onSubmit).toHaveBeenCalledWith({
      displayName: 'Camille',
      email: 'camille@example.com',
      password: 'motdepasse',
      acceptsPrivacyPolicy: true,
    });
  });
});
