import { screen, userEvent } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import type { Child } from '@/data/children';
import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { ChildDetail } from '.';

const t = strings.childDetail;
const lea: Child = {
  id: 'lea',
  display_name: 'Léa',
  gender: 'girl',
  grade: 'CE2',
  birth_year: null,
  theme_id: 'kawaii',
};

function renderDetail(props: Partial<ComponentProps<typeof ChildDetail>> = {}) {
  return renderWithTheme(
    <ChildDetail
      child={lea}
      pairing={{ status: 'idle' }}
      creatingCode={false}
      pairingError={null}
      onCreateCode={jest.fn()}
      devices={[]}
      revokingDeviceId={null}
      onRevokeDevice={jest.fn()}
      {...props}
    />,
  );
}

describe('ChildDetail', () => {
  it('shows the code and how long it stays valid', async () => {
    await renderDetail({
      pairing: { status: 'showing', code: 'ABC234', link: 'link', secondsLeft: 125 },
    });

    expect(screen.getByTestId('pairing-code')).toHaveTextContent('ABC234');
    expect(screen.getByText(t.expiresIn(3))).toBeOnTheScreen();
  });

  it('says when the code has expired or was used', async () => {
    await renderDetail({
      pairing: { status: 'showing', code: 'ABC234', link: 'link', secondsLeft: 0 },
    });
    expect(screen.getByText(t.expired)).toBeOnTheScreen();

    await renderDetail({ pairing: { status: 'paired' } });
    expect(screen.getByText(t.paired)).toBeOnTheScreen();
  });

  it('lets the parent create a code and revoke a device', async () => {
    const onCreateCode = jest.fn();
    const onRevokeDevice = jest.fn();
    const user = userEvent.setup();
    await renderDetail({
      onCreateCode,
      onRevokeDevice,
      devices: [{ id: 'phone', platform: 'android', paired_at: '2026-10-13T12:00:00Z' }],
    });

    await user.press(screen.getByRole('button', { name: t.createCode }));
    await user.press(screen.getByRole('button', { name: t.revoke }));

    expect(onCreateCode).toHaveBeenCalled();
    expect(onRevokeDevice).toHaveBeenCalledWith('phone');
    expect(screen.getByText(t.pairedOn('13 octobre 2026'))).toBeOnTheScreen();
  });
});
