import { DEFAULT_ROUTINE } from '@math-genius/shared';
import { screen, userEvent } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import type { Child } from '@/data/children';
import type { PairedDevice } from '@/data/devices';
import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';
import { rewards } from '@/test-utils/rewards';

import { ChildDetail } from '.';

const t = strings.childDetail;
const phone = (push_status: PairedDevice['push_status']): PairedDevice => ({
  id: 'phone',
  platform: 'android',
  push_status,
  paired_at: '2026-10-13T12:00:00Z',
});
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
      sessions={[]}
      onOpenSession={jest.fn()}
      routine={null}
      vacations={[]}
      onEditRoutine={jest.fn()}
      nudge={{ onSend: jest.fn(), sending: false, result: null, error: null }}
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
  it('sums up the child’s streak, level and gems', async () => {
    await renderDetail({ progress: rewards().progress });
    expect(screen.getByText(strings.rewards.parentLine(4, 6, 5, 45, 0))).toBeOnTheScreen();
  });

  it('offers to set a routine', async () => {
    const onEditRoutine = jest.fn();
    const user = userEvent.setup();
    await renderDetail({ onEditRoutine });
    expect(screen.getByText(strings.routine.none)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: strings.routine.set }));
    expect(onEditRoutine).toHaveBeenCalled();
  });

  it('sums up the routine and the coming holidays', async () => {
    await renderDetail({
      routine: DEFAULT_ROUTINE,
      vacations: [{ id: 'v', child_id: 'lea', from_date: '2026-10-17', to_date: '2026-11-01' }],
    });
    expect(screen.getByText(strings.routine.deadlineLine('20:30'))).toBeOnTheScreen();
    expect(
      screen.getByText(strings.routine.vacationLine('17 octobre', '1 novembre')),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: strings.routine.edit })).toBeOnTheScreen();
  });

  it('lets the parent message a child with a paired device', async () => {
    const onSend = jest.fn();
    const user = userEvent.setup();
    await renderDetail({
      devices: [phone('enabled')],
      nudge: { onSend, sending: false, result: null, error: null },
    });
    expect(screen.getByText(t.push.enabled)).toBeOnTheScreen();
    expect(screen.queryByText(strings.nudge.unreachable('Léa'))).toBeNull();
    const [, second] = strings.nudge.suggestions;
    await user.press(screen.getByRole('radio', { name: second }));
    await user.press(screen.getByRole('button', { name: strings.nudge.send }));
    expect(onSend).toHaveBeenCalledWith(second);

    await user.clear(screen.getByLabelText(strings.nudge.message));
    await user.press(screen.getByRole('button', { name: strings.nudge.send }));
    expect(screen.getByText(strings.nudge.errors.message)).toBeOnTheScreen();
    await user.type(screen.getByLabelText(strings.nudge.message), '  On y va ?  ');
    await user.press(screen.getByRole('button', { name: strings.nudge.send }));
    expect(onSend).toHaveBeenLastCalledWith('On y va ?');
  });

  it('says when no device shows the message', async () => {
    await renderDetail({
      devices: [phone(null)],
      nudge: { onSend: jest.fn(), sending: false, result: 'no_device', error: null },
    });
    expect(screen.getByText(strings.nudge.noDevice('Léa'))).toBeOnTheScreen();
    expect(screen.getByText(t.push.unknown)).toBeOnTheScreen();
  });

  it('warns that a device without push (Expo Go on Android, a browser) gets no reminder', async () => {
    await renderDetail({ devices: [phone('unsupported')] });
    expect(screen.getByText(t.push.unsupported)).toBeOnTheScreen();
    expect(screen.getByText(strings.nudge.unreachable('Léa'))).toBeOnTheScreen();
  });

  it('tells the parent when the child refused notifications', async () => {
    await renderDetail({ devices: [phone('denied')] });
    expect(screen.getByText(t.push.denied)).toBeOnTheScreen();
    expect(screen.getByText(strings.nudge.unreachable('Léa'))).toBeOnTheScreen();
  });

  it('offers no message before a device is paired', async () => {
    await renderDetail();
    expect(screen.queryByText(strings.nudge.title('Léa'))).toBeNull();
  });

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
      devices: [phone('enabled')],
    });

    await user.press(screen.getByRole('button', { name: t.createCode }));
    await user.press(screen.getByRole('button', { name: t.revoke }));

    expect(onCreateCode).toHaveBeenCalled();
    expect(onRevokeDevice).toHaveBeenCalledWith('phone');
    expect(screen.getByText(t.pairedOn('13 octobre 2026'))).toBeOnTheScreen();
  });
});
