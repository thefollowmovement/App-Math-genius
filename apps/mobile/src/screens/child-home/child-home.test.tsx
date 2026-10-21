import { worldMap } from '@math-genius/exercise-engine';
import type { DayPlan } from '@math-genius/shared';
import { screen, userEvent } from '@testing-library/react-native';

import type { Child } from '@/data/children';
import { currentStop } from '@/data/mission-model';
import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';
import { parentReward, rewards } from '@/test-utils/rewards';

import { ChildHome } from '.';

const lea: Child = {
  id: 'lea',
  display_name: 'Léa',
  gender: 'girl',
  grade: 'CM1',
  birth_year: null,
  theme_id: 'neon',
  avatar: {},
  personalization_consent_at: null,
  universe_asked_at: null,
  game_minutes_limit: 20,
};
const t = strings.childHome;
const goal = { type: 'duration', minutes: 15 } as const;
// Planned today, to finish before 18:00.
const planned: DayPlan = { kind: 'planned', start: 17 * 60, deadline: 18 * 60 };
const today = { plan: planned, goal } as const;

describe('ChildHome', () => {
  it('offers the placement test before the mission, and resumes it in its place', async () => {
    const onStartPlacement = jest.fn();
    const user = userEvent.setup();
    const { rerender } = await renderWithTheme(
      <ChildHome
        {...today}
        child={lea}
        practice={{ status: 'ready' }}
        placement="first"
        onStartPlacement={onStartPlacement}
        sync="idle"
        onStart={jest.fn()}
      />,
    );
    expect(screen.getByText(strings.placement.card.firstText)).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: t.mission.daily })).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: strings.placement.card.start }));
    expect(onStartPlacement).toHaveBeenCalledTimes(1);

    await rerender(
      <ChildHome
        {...today}
        child={lea}
        practice={{ status: 'ready' }}
        placement="resume"
        onStartPlacement={onStartPlacement}
        sync="idle"
        onStart={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: strings.placement.card.resume })).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: t.mission.daily })).toBeNull();
  });

  it('plays, resumes or offers bonus training', async () => {
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
    expect(screen.getByRole('header', { name: t.mission.daily })).toBeOnTheScreen();
    expect(screen.getByLabelText(t.mission.before('18:00'))).toBeOnTheScreen();
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
    expect(screen.getByRole('button', { name: t.resumeLabel(40) })).toBeOnTheScreen();
    expect(screen.getByRole('progressbar', { name: t.mission.progress })).toHaveAccessibilityValue({
      now: 40,
    });
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
    expect(screen.getByRole('header', { name: t.mission.done })).toBeOnTheScreen();
    // Done in time: no deadline left to show.
    expect(screen.queryByLabelText(t.mission.before('18:00'))).toBeNull();
    expect(screen.getByText(t.todayDone)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: t.bonus })).toBeOnTheScreen();
    expect(screen.getByText(t.syncing)).toBeOnTheScreen();
  });

  it('names the mission after where the child stands on the map', async () => {
    const stop = currentStop(
      worldMap({ grade: 'CM1', mastery: {}, at: '2026-10-19T17:00:00Z', defeated: [] }),
    );
    await renderWithTheme(
      <ChildHome
        {...today}
        child={lea}
        practice={{ status: 'ready' }}
        stop={stop}
        sync="idle"
        onStart={jest.fn()}
      />,
    );
    expect(screen.getByText(strings.map.islands.numbers.name)).toBeOnTheScreen();
  });

  it('opens the map, the shop, the badges and the look editor from its bar', async () => {
    const pages = {
      onOpenMap: jest.fn(),
      onOpenShop: jest.fn(),
      onOpenBadges: jest.fn(),
      onOpenLook: jest.fn(),
    };
    const user = userEvent.setup();
    await renderWithTheme(
      <ChildHome
        {...today}
        {...pages}
        child={lea}
        practice={{ status: 'ready' }}
        sync="idle"
        onStart={jest.fn()}
      />,
    );
    for (const name of [t.nav.map, t.nav.shop, t.nav.badges, t.nav.look]) {
      await user.press(screen.getByRole('button', { name }));
    }
    for (const open of Object.values(pages)) expect(open).toHaveBeenCalledTimes(1);
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
    expect(screen.getAllByText(t.notAvailable).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: t.start })).toBeNull();
  });

  it('invites to train anyway on a day off or during holidays', async () => {
    const { rerender } = await renderWithTheme(
      <ChildHome
        child={lea}
        practice={{ status: 'ready' }}
        plan={{ kind: 'off' }}
        goal={{ type: 'count', count: 20 }}
        sync="idle"
        onStart={jest.fn()}
      />,
    );
    expect(screen.getByRole('header', { name: t.mission.off })).toBeOnTheScreen();
    expect(screen.getByText(t.dayOff)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: t.train })).toBeOnTheScreen();

    await rerender(
      <ChildHome
        child={lea}
        practice={{ status: 'ready' }}
        plan={{ kind: 'vacation' }}
        goal={goal}
        sync="idle"
        onStart={jest.fn()}
      />,
    );
    expect(screen.getByText(t.vacation)).toBeOnTheScreen();
  });

  it('switches profile when the device holds several', async () => {
    const onSwitchProfile = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <ChildHome
        {...today}
        child={lea}
        practice={{ status: 'ready' }}
        sync="idle"
        onStart={jest.fn()}
        onSwitchProfile={onSwitchProfile}
      />,
    );
    await user.press(screen.getByRole('button', { name: t.switchProfile }));
    expect(onSwitchProfile).toHaveBeenCalled();
  });
});

describe('ChildHome rewards', () => {
  it('shows streak, gems, badges and level, the chests to open, the challenge and the reward', async () => {
    const onOpenChest = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <ChildHome
        {...today}
        child={{ ...lea, avatar: { hero: 'nova', wear: { companion: 'renard' } } }}
        practice={{ status: 'ready' }}
        rewards={rewards([
          { id: 'chest-1', kind: 'common' },
          { id: 'chest-2', kind: 'rare' },
        ])}
        challenge={{ code: 'daily-5', threshold: 5, progress: 3, gems: 20, completed: false }}
        nextReward={parentReward({
          title: 'Une sortie au cinéma',
          goal: 'streak',
          target: 7,
          value: 4,
        })}
        onOpenChest={onOpenChest}
        sync="idle"
        onStart={jest.fn()}
      />,
    );
    expect(screen.getByLabelText(strings.rewards.streakLabel(4))).toBeOnTheScreen();
    expect(screen.getByLabelText(strings.rewards.gemsLabel(45))).toBeOnTheScreen();
    expect(screen.getByLabelText(t.badgesLabel(3))).toBeOnTheScreen();
    expect(screen.getByText(t.level(5))).toBeOnTheScreen();
    expect(screen.getByRole('progressbar', { name: t.xpLabel })).toHaveAccessibilityValue({
      now: 8,
      text: t.xpValue(40, 500),
    });
    expect(screen.getByText(strings.rewards.chestsWaiting(2))).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: strings.rewards.openChest }));
    expect(onOpenChest).toHaveBeenCalledWith('chest-1');
    // Léa's hero, Nova, with Kitsune beside it.
    expect(
      screen.getAllByRole('image', {
        name: strings.heroes.portrait('Nova', [strings.companions.items.renard.name]),
      }).length,
    ).toBeGreaterThan(0);
    // This week's challenge, by its short name; its whole rule is read out.
    expect(screen.getByText(strings.challenge.names['daily-5'])).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        strings.challenge.cardLabel(strings.challenge.items['daily-5'], 3, 5, 20),
      ),
    ).toBeOnTheScreen();
    // The parent's reward closest to unlock.
    expect(screen.getByText('Une sortie au cinéma')).toBeOnTheScreen();
    expect(
      screen.getByRole('progressbar', { name: strings.parentRewards.child.title }),
    ).toHaveAccessibilityValue({ text: strings.parentRewards.child.progressLabel(4, 7) });
  });
});

describe('ChildHome personalization', () => {
  it('asks about the child’s universe after the first test, and shows the super-power', async () => {
    const onOpenUniverse = jest.fn();
    const user = userEvent.setup();
    const { rerender } = await renderWithTheme(
      <ChildHome
        {...today}
        child={lea}
        practice={{ status: 'ready' }}
        universe="first"
        onOpenUniverse={onOpenUniverse}
        superPower={{ kind: 'strand', strand: 'fractions', how: 'ahead' }}
        sync="idle"
        onStart={jest.fn()}
      />,
    );
    expect(screen.getByText(strings.universe.card.firstText)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: strings.universe.card.answer }));
    expect(onOpenUniverse).toHaveBeenCalledTimes(1);
    expect(
      screen.getByLabelText(
        `${strings.superPower.label} : ${strings.superPower.strands.fractions}. ${strings.superPower.how.ahead}`,
      ),
    ).toBeOnTheScreen();

    // The first test comes first.
    await rerender(
      <ChildHome
        {...today}
        child={lea}
        practice={{ status: 'ready' }}
        placement="first"
        onStartPlacement={jest.fn()}
        universe="first"
        onOpenUniverse={onOpenUniverse}
        sync="idle"
        onStart={jest.fn()}
      />,
    );
    expect(screen.queryByText(strings.universe.card.firstText)).not.toBeOnTheScreen();
    expect(screen.queryByText(strings.superPower.label)).not.toBeOnTheScreen();
  });
});
