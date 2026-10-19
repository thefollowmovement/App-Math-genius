import { DEFAULT_ROUTINE } from '@math-genius/shared';
import { screen, userEvent, within } from '@testing-library/react-native';

import type { VacationRow } from '@/data/routine-plan';
import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';
import { dayOptionText } from '@/utils/routine-text';

import { RoutineSettings } from './routine-settings';

const t = strings.routine;
const toussaint: VacationRow = {
  id: 'toussaint',
  child_id: 'lea',
  from_date: '2026-10-17',
  to_date: '2026-11-01',
};

async function renderSettings(routine = DEFAULT_ROUTINE) {
  const props = {
    onSave: jest.fn(),
    onAddVacation: jest.fn(),
    onRemoveVacation: jest.fn(),
  };
  await renderWithTheme(
    <RoutineSettings
      {...props}
      routine={routine}
      saving={false}
      saved={false}
      saveError={null}
      vacations={[toussaint]}
      today="2026-10-16"
      addingVacation={false}
      vacationError={null}
      removingVacationId={null}
    />,
  );
  return { ...props, user: userEvent.setup() };
}

const pick = (testID: string, label: string) =>
  within(screen.getByTestId(testID)).getByRole('radio', { name: label });

describe('routine settings', () => {
  it('saves the days, times and goal chosen by the parent', async () => {
    const { onSave, user } = await renderSettings();
    await user.press(screen.getByRole('checkbox', { name: 'lundi' }));
    await user.press(screen.getByRole('checkbox', { name: 'samedi' }));
    await user.press(screen.getByRole('switch', { name: t.form.weekend }));
    await user.press(pick('weekend-start-time', '10:30'));
    await user.press(pick('deadline-time', '21:00'));
    await user.press(pick('goal', t.goals.count(20)));
    await user.press(screen.getByRole('button', { name: t.form.submit }));

    expect(onSave).toHaveBeenCalledWith({
      ...DEFAULT_ROUTINE,
      days: [2, 3, 4, 5, 6],
      weekendStartTime: '10:30',
      deadlineTime: '21:00',
      goal: { type: 'count', count: 20 },
    });
  });

  it('drops another start time once switched off', async () => {
    const { onSave, user } = await renderSettings({
      ...DEFAULT_ROUTINE,
      wednesdayStartTime: '14:00',
    });
    expect(pick('wednesday-start-time', '14:00')).toBeSelected();
    await user.press(screen.getByRole('switch', { name: t.form.wednesday }));
    expect(screen.queryByTestId('wednesday-start-time')).toBeNull();
    await user.press(screen.getByRole('button', { name: t.form.submit }));
    expect(onSave).toHaveBeenCalledWith(DEFAULT_ROUTINE);
  });

  it('explains what to fix instead of saving', async () => {
    const { onSave, user } = await renderSettings({ ...DEFAULT_ROUTINE, days: [1] });
    await user.press(screen.getByRole('checkbox', { name: 'lundi' }));
    await user.press(pick('start-time', '21:00'));
    await user.press(screen.getByRole('button', { name: t.form.submit }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(t.form.errors.days)).toBeOnTheScreen();
    expect(screen.getByText(t.form.errors.deadlineTime)).toBeOnTheScreen();

    await user.press(pick('start-time', '17:00'));
    expect(screen.queryByText(t.form.errors.deadlineTime)).toBeNull();
  });

  it('adds and removes holidays', async () => {
    const { onAddVacation, onRemoveVacation, user } = await renderSettings();
    const period = t.vacations.period('17 octobre', '1 novembre');
    expect(screen.getByText(period)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.vacations.removeLabel(period) }));
    expect(onRemoveVacation).toHaveBeenCalledWith('toussaint');

    await user.press(pick('vacation-from', dayOptionText('2026-12-19')));
    // A week by default, moved with its first day.
    expect(pick('vacation-to', dayOptionText('2026-12-25'))).toBeSelected();
    await user.press(pick('vacation-to', dayOptionText('2027-01-03')));
    await user.press(screen.getByRole('button', { name: t.vacations.add }));
    expect(onAddVacation).toHaveBeenCalledWith({ fromDate: '2026-12-19', toDate: '2027-01-03' });
  });
});
