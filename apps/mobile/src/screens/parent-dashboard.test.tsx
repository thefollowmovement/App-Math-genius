import { screen, userEvent } from '@testing-library/react-native';

import type { Child } from '@/data/children';
import { attemptViews } from '@/data/session-report';
import { strings } from '@/i18n';
import { exerciseOfType } from '@/test-utils/exercises';
import { attemptRow, sessionRow } from '@/test-utils/family';
import { renderWithTheme } from '@/test-utils/render';
import { wrongResponse } from '@/test-utils/responses';
import { rightAnswerText } from '@/utils/exercise-text';

import { ParentHome } from './parent-home';
import { SessionDetail } from './session-detail';
import { TodaySessions } from './today-sessions';

const lea: Child = {
  id: 'lea',
  display_name: 'Léa',
  gender: 'girl',
  grade: 'CM1',
  birth_year: null,
  theme_id: 'kawaii',
  avatar: {},
};
const tom: Child = { ...lea, id: 'tom', display_name: 'Tom' };
const zoe: Child = { ...lea, id: 'zoe', display_name: 'Zoé' };
const t = strings.todaySessions;

describe('parent home', () => {
  it('shows where each child stands today', async () => {
    await renderWithTheme(
      <ParentHome
        parentName="Camille"
        childProfiles={[lea, tom, zoe]}
        today={{
          lea: { status: 'done', main: sessionRow(), startsAt: null },
          tom: { status: 'not_started', main: null, startsAt: 17 * 60 },
          zoe: { status: 'missed', main: null, startsAt: null },
        }}
        onAddChild={jest.fn()}
        onOpenChild={jest.fn()}
        onChildMode={jest.fn()}
        onSignOut={jest.fn()}
      />,
    );
    expect(
      screen.getByText(
        strings.parentHome.todayLine(strings.parentHome.today.done, '36/45 · 15 min'),
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        strings.parentHome.todayLine(
          strings.parentHome.today.not_started,
          strings.parentHome.startsAt('17:00'),
        ),
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText(strings.parentHome.today.missed)).toBeOnTheScreen();
  });
});

describe('today’s sessions', () => {
  it('lists status, score and duration, and opens a session', async () => {
    const onOpenSession = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <TodaySessions
        sessions={[
          sessionRow(),
          sessionRow({
            id: 'bonus',
            kind: 'bonus',
            completed_at: null,
            answered: 0,
            score: 0,
            duration_s: 0,
            flagged: true,
          }),
        ]}
        onOpenSession={onOpenSession}
      />,
    );
    expect(screen.getByText(t.kinds.daily)).toBeOnTheScreen();
    expect(screen.getByText(t.states.validated)).toBeOnTheScreen();
    expect(screen.getByText(t.summary(t.score(36, 45), t.duration(15)))).toBeOnTheScreen();
    expect(screen.getByText(t.states.in_progress)).toBeOnTheScreen();
    expect(screen.getByText(t.summary(t.score(0, 0), t.duration(0)))).toBeOnTheScreen();
    expect(screen.getByText(t.flagged)).toBeOnTheScreen();

    await user.press(screen.getByText(t.kinds.bonus));
    expect(onOpenSession).toHaveBeenCalledWith('bonus');
  });

  it('says when there is nothing yet', async () => {
    await renderWithTheme(<TodaySessions sessions={[]} onOpenSession={jest.fn()} />);
    expect(screen.getByText(t.empty)).toBeOnTheScreen();
  });
});

describe('session detail', () => {
  it('shows each question, the child’s answer and the right one after a mistake', async () => {
    const exercise = exerciseOfType('choice');
    await renderWithTheme(
      <SessionDetail
        session={sessionRow({ goal_met: false })}
        attempts={attemptViews([attemptRow(exercise, wrongResponse(exercise))])}
      />,
    );
    expect(screen.getByText(t.states.not_validated)).toBeOnTheScreen();
    expect(screen.getByText(exercise.prompt)).toBeOnTheScreen();
    expect(
      screen.getByText(strings.sessionDetail.rightAnswer(rightAnswerText(exercise))),
    ).toBeOnTheScreen();
    expect(screen.getByText(strings.sessionDetail.meta(false, 8, false))).toBeOnTheScreen();
  });
});
