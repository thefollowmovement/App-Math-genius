import { type ChildProgress, readProgress } from '@math-genius/shared';
import { PROGRESS_SAMPLE } from '@math-genius/shared/src/testing/progress-samples';
import { screen, userEvent } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { Progress } from '.';
import { RecapSettings } from '../recap-settings';

const t = strings.progress;
const progress = readProgress(PROGRESS_SAMPLE) as ChildProgress;

const props = (
  fields: Partial<ComponentProps<typeof Progress>> = {},
): ComponentProps<typeof Progress> => ({
  childName: 'Léa',
  grade: 'CM1',
  progress,
  error: false,
  onRetry: jest.fn(),
  range: 'month',
  onRange: jest.fn(),
  month: '2026-09-01',
  onMonth: jest.fn(),
  canGoNext: false,
  recaps: [{ id: 'r1', periodStart: '2026-08-01' }],
  onOpenRecap: jest.fn(),
  openingRecapId: null,
  recapError: false,
  onOpenSettings: jest.fn(),
  ...fields,
});

describe('Progress', () => {
  it('says first whether it goes well, with a colored verdict', async () => {
    await renderWithTheme(<Progress {...props()} />);
    expect(screen.getByText(t.verdict.title.watch)).toBeOnTheScreen();
    expect(
      screen.getByText(
        t.verdict.irregular('Léa', t.verdict.sessions(3, 5), t.verdict.percent(0.8), false),
      ),
    ).toBeOnTheScreen();
  });

  it('shows the month’s calendar, each day read out with its status', async () => {
    const onMonth = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(<Progress {...props({ onMonth })} />);
    expect(screen.getByText('septembre 2026')).toBeOnTheScreen();
    expect(
      screen.getByLabelText(t.calendar.day('mercredi 9 septembre', t.calendar.status.started, 5)),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(t.calendar.day('jeudi 24 septembre', t.calendar.status.vacation, 0)),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(t.calendar.day('mardi 29 septembre', t.calendar.status.missed, 0)),
    ).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.calendar.previous }));
    expect(onMonth).toHaveBeenCalledWith('previous');
    // The current month has no next one.
    expect(screen.getByRole('button', { name: t.calendar.next })).toBeDisabled();
  });

  it('draws the curves over the range chosen', async () => {
    const onRange = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(<Progress {...props({ onRange })} />);
    expect(
      screen.getByLabelText(`${t.curves.time.day}. ${t.curves.timeTotal(240)}`),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(`${t.curves.success.day}. ${t.curves.successTotal(79)}`),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(`${t.curves.xp.week}. ${t.curves.xpTotal(1050)}`),
    ).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: t.curves.ranges.month })).toBeSelected();
    expect(screen.getByRole('tab', { name: t.curves.ranges.week })).not.toBeSelected();
    await user.press(screen.getByRole('tab', { name: t.curves.ranges.quarter }));
    expect(onRange).toHaveBeenCalledWith('quarter');
  });

  it('shows mastery by domain and the skills by list', async () => {
    await renderWithTheme(<Progress {...props()} />);
    expect(screen.getByText(t.domains.names.numbers)).toBeOnTheScreen();
    expect(screen.getByText(t.domains.percent(54))).toBeOnTheScreen();
    expect(screen.getByText(t.domains.mastered(1, 4))).toBeOnTheScreen();
    expect(screen.getByLabelText(t.domains.names.numbers)).toHaveAccessibilityValue({
      now: 54,
      text: t.domains.value(54, 1, 4),
    });
    expect(screen.getByText(`${t.skills.lists.mastered} (2)`)).toBeOnTheScreen();
    expect(screen.getByText(`${t.skills.lists.to_consolidate} (4)`)).toBeOnTheScreen();
    expect(
      screen.getByText('Résoudre des situations simples de proportionnalité'),
    ).toBeOnTheScreen();
  });

  it('shows where the child struggles, with a real mistake', async () => {
    await renderWithTheme(<Progress {...props()} />);
    expect(screen.getByText(t.blocking.errors(17, 64))).toBeOnTheScreen();
    expect(
      screen.getByText(
        t.blocking.mistake('compare les chiffres après la virgule comme des nombres entiers'),
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('Range ces nombres du plus petit au plus grand.')).toBeOnTheScreen();
    expect(screen.getByText('4,35 < 4,42 < 4,5 < 4,8')).toBeOnTheScreen();
    expect(screen.getByText(t.programme.ranks.on_track)).toBeOnTheScreen();
  });

  it('opens a monthly recap’s PDF and the recap settings', async () => {
    const onOpenRecap = jest.fn();
    const onOpenSettings = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(<Progress {...props({ onOpenRecap, onOpenSettings })} />);
    expect(screen.getByText(t.recaps.item('août'))).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.recaps.downloadLabel('août') }));
    expect(onOpenRecap).toHaveBeenCalledWith('r1');
    await user.press(screen.getByRole('button', { name: t.recaps.settings }));
    expect(onOpenSettings).toHaveBeenCalled();
  });

  it('waits for the statistics, and offers to try again after an error', async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    const { rerender } = await renderWithTheme(<Progress {...props({ progress: undefined })} />);
    expect(screen.getByText(t.loading)).toBeOnTheScreen();
    await rerender(<Progress {...props({ progress: undefined, error: true, onRetry })} />);
    await user.press(screen.getByRole('button', { name: t.retry }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('RecapSettings', () => {
  it('turns each recap on or off, by notification and by email', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <RecapSettings
        preferences={{
          weeklyPush: true,
          weeklyEmail: false,
          monthlyPush: true,
          monthlyEmail: true,
        }}
        onChange={onChange}
        error={null}
      />,
    );
    expect(screen.getByText(strings.recapSettings.weekly)).toBeOnTheScreen();
    await user.press(screen.getByTestId('weeklyEmail'));
    expect(onChange).toHaveBeenCalledWith('weeklyEmail', true);
    await user.press(screen.getByTestId('monthlyPush'));
    expect(onChange).toHaveBeenCalledWith('monthlyPush', false);
  });
});
