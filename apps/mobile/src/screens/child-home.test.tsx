import { screen, userEvent } from '@testing-library/react-native';

import type { Child } from '@/data/children';
import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';
import { award, rewards } from '@/test-utils/rewards';

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
    const summary = {
      kind: 'daily' as const,
      goalMet: false,
      answered: 30,
      correct: 15,
      minutes: 22,
      progressed: [],
    };
    await renderWithTheme(
      <SessionSummary
        summary={summary}
        saved={false}
        award={{ status: 'waiting' }}
        onOpenChest={jest.fn()}
        onOpenBadges={jest.fn()}
        onBonus={jest.fn()}
        onHome={jest.fn()}
      />,
    );
    expect(screen.getByText(strings.summary.finished)).toBeOnTheScreen();
    expect(screen.getByText(strings.summary.notValidated)).toBeOnTheScreen();
    expect(screen.getByText(strings.summary.score(15, 30))).toBeOnTheScreen();
    expect(screen.getByText(strings.summary.savedOffline)).toBeOnTheScreen();
    expect(screen.getByText(strings.award.waiting)).toBeOnTheScreen();
  });

  it('shows what the server awarded, and opens the chest', async () => {
    const onOpenChest = jest.fn();
    const onOpenBadges = jest.fn();
    const user = userEvent.setup();
    const summary = {
      kind: 'daily' as const,
      goalMet: true,
      answered: 40,
      correct: 32,
      minutes: 15,
      progressed: [],
    };
    await renderWithTheme(
      <SessionSummary
        summary={summary}
        saved
        // A badge from a newer server is left out.
        award={{ status: 'ready', award: award({ badges: ['perfect-1', 'from-the-future'] }) }}
        onOpenChest={onOpenChest}
        onOpenBadges={onOpenBadges}
        onBonus={jest.fn()}
        onHome={jest.fn()}
      />,
    );
    expect(screen.getByText(strings.award.xp(340))).toBeOnTheScreen();
    expect(screen.getByText(strings.award.levelUp(5))).toBeOnTheScreen();
    expect(screen.getByText(strings.award.streak(4))).toBeOnTheScreen();
    expect(screen.getByText(strings.award.streakUp)).toBeOnTheScreen();
    expect(screen.getByText(strings.award.gems(5))).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: strings.award.openChest }));
    expect(onOpenChest).toHaveBeenCalledWith('chest-1');
    expect(screen.getByText(strings.award.newBadges(1))).toBeOnTheScreen();
    const perfect = strings.badges.items['perfect-1'];
    expect(screen.getByText(`${perfect.icon} ${perfect.title}`)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: strings.award.seeBadges }));
    expect(onOpenBadges).toHaveBeenCalled();
  });

  it('tells how the boss went', async () => {
    const summary = {
      kind: 'boss' as const,
      goalMet: true,
      answered: 10,
      correct: 9,
      minutes: 6,
      progressed: [],
    };
    const props = { saved: true, onOpenChest: jest.fn(), onOpenBadges: jest.fn() };
    const won = award({
      chest: null,
      gems: 0,
      boss: { grade: 'CM1', domain: 'numbers', passed: true, first: true },
    });
    await renderWithTheme(
      <SessionSummary
        {...props}
        summary={summary}
        award={{ status: 'ready', award: won }}
        onBonus={jest.fn()}
        onHome={jest.fn()}
      />,
    );
    expect(screen.getByText(strings.summary.bossOver)).toBeOnTheScreen();
    expect(screen.getByText(`${strings.map.boss.icon} ${strings.award.bossWon}`)).toBeOnTheScreen();
    expect(
      screen.getByText(strings.award.islandDone(strings.map.islands.numbers.the)),
    ).toBeOnTheScreen();

    const lost = award({
      answered: 10,
      boss: { grade: 'CM1', domain: 'numbers', passed: false, first: false },
    });
    await renderWithTheme(
      <SessionSummary
        {...props}
        summary={{ ...summary, correct: 6 }}
        award={{ status: 'ready', award: lost }}
        onBonus={jest.fn()}
        onHome={jest.fn()}
      />,
    );
    expect(screen.getByText(strings.award.bossLost(8))).toBeOnTheScreen();
  });

  it('waits for the server while the rewards are computed', async () => {
    const summary = {
      kind: 'daily' as const,
      goalMet: false,
      answered: 20,
      correct: 9,
      minutes: 22,
      progressed: [],
    };
    await renderWithTheme(
      <SessionSummary
        summary={summary}
        saved
        award={{ status: 'computing' }}
        onOpenChest={jest.fn()}
        onOpenBadges={jest.fn()}
        onBonus={jest.fn()}
        onHome={jest.fn()}
      />,
    );
    expect(screen.getByText(strings.award.computing)).toBeOnTheScreen();
  });
});

describe('ChildHome rewards', () => {
  it('shows streak, gems and level, the chests to open and the badges', async () => {
    const onOpenChest = jest.fn();
    const onOpenBadges = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <ChildHome
        {...today}
        child={lea}
        practice={{ status: 'ready' }}
        rewards={rewards([
          { id: 'chest-1', kind: 'common' },
          { id: 'chest-2', kind: 'rare' },
        ])}
        onOpenChest={onOpenChest}
        onOpenBadges={onOpenBadges}
        sync="idle"
        onStart={jest.fn()}
      />,
    );
    expect(screen.getByLabelText(strings.rewards.streakLabel(4))).toBeOnTheScreen();
    expect(screen.getByLabelText(strings.rewards.gemsLabel(45))).toBeOnTheScreen();
    expect(screen.getByText(strings.rewards.level(5))).toBeOnTheScreen();
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ min: 0, max: 500, now: 40 });
    expect(screen.getByText(strings.rewards.chestsWaiting(2))).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: strings.rewards.openChest }));
    expect(onOpenChest).toHaveBeenCalledWith('chest-1');
    await user.press(screen.getByRole('button', { name: strings.badges.open(3) }));
    expect(onOpenBadges).toHaveBeenCalled();
  });
});
