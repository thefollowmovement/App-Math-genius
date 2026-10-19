import { screen, userEvent } from '@testing-library/react-native';

import type { Child } from '@/data/children';
import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { ChildHome } from './child-home';
import { SessionSummary } from './session-summary';

const lea: Child = {
  id: 'lea',
  display_name: 'Léa',
  gender: 'girl',
  grade: 'CM1',
  birth_year: null,
  theme_id: 'kawaii',
};
const t = strings.childHome;
const goal = { type: 'duration', minutes: 15 } as const;
const today = { plan: 'planned', goal } as const;

describe('ChildHome', () => {
  it('starts, resumes or offers bonus training', async () => {
    const onStart = jest.fn();
    const user = userEvent.setup();
    const { rerender } = await renderWithTheme(
      <ChildHome
        {...today}
        child={lea}
        practice={{ status: 'ready' }}
        sync="idle"
        onStart={onStart}
      />,
    );
    expect(screen.getByText(t.readyGoal(strings.routine.goals.duration(15)))).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.start }));
    expect(onStart).toHaveBeenCalledTimes(1);

    await rerender(
      <ChildHome
        {...today}
        child={lea}
        practice={{ status: 'in-progress', percent: 40 }}
        sync="offline"
        onStart={onStart}
      />,
    );
    expect(screen.getByRole('button', { name: t.resume(40) })).toBeOnTheScreen();
    expect(screen.getByText(t.offline)).toBeOnTheScreen();

    await rerender(
      <ChildHome
        {...today}
        child={lea}
        practice={{ status: 'done' }}
        sync="syncing"
        onStart={onStart}
      />,
    );
    expect(screen.getByText(t.todayDone)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: t.bonus })).toBeOnTheScreen();
    expect(screen.getByText(t.syncing)).toBeOnTheScreen();
  });

  it('says when the grade has no exercises yet', async () => {
    await renderWithTheme(
      <ChildHome
        {...today}
        child={lea}
        practice={{ status: 'unavailable' }}
        sync="idle"
        onStart={jest.fn()}
      />,
    );
    expect(screen.getByText(t.notAvailable)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: t.start })).toBeNull();
  });

  it('invites to train anyway on a day off or during holidays', async () => {
    const { rerender } = await renderWithTheme(
      <ChildHome
        child={lea}
        practice={{ status: 'ready' }}
        plan="off"
        goal={{ type: 'count', count: 20 }}
        sync="idle"
        onStart={jest.fn()}
      />,
    );
    expect(screen.getByText(t.dayOff)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: t.train })).toBeOnTheScreen();

    await rerender(
      <ChildHome
        child={lea}
        practice={{ status: 'ready' }}
        plan="vacation"
        goal={goal}
        sync="idle"
        onStart={jest.fn()}
      />,
    );
    expect(screen.getByText(t.vacation)).toBeOnTheScreen();
  });
});

describe('SessionSummary', () => {
  it('celebrates, and says whether the session is saved or waiting', async () => {
    const summary = { goalMet: false, answered: 30, correct: 15, minutes: 22, progressed: [] };
    await renderWithTheme(
      <SessionSummary summary={summary} saved={false} onBonus={jest.fn()} onHome={jest.fn()} />,
    );
    expect(screen.getByText(strings.summary.finished)).toBeOnTheScreen();
    expect(screen.getByText(strings.summary.notValidated)).toBeOnTheScreen();
    expect(screen.getByText(strings.summary.score(15, 30))).toBeOnTheScreen();
    expect(screen.getByText(strings.summary.savedOffline)).toBeOnTheScreen();
  });
});
