import { themes } from '@math-genius/ui';
import { screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';
import { award } from '@/test-utils/rewards';

import { SessionSummary } from '.';

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
    // The hero comforts, never scolds.
    expect(screen.getByText(strings.heroes.proud)).toBeOnTheScreen();
    expect(screen.getByLabelText(strings.summary.score(15, 30))).toBeOnTheScreen();
    expect(screen.getByText(strings.summary.scoreValue(15, 30))).toBeOnTheScreen();
    expect(
      screen.getByText(`${strings.summary.duration(22)} · ${strings.summary.savedOffline}`),
    ).toBeOnTheScreen();
    expect(screen.getByText(strings.award.waiting)).toBeOnTheScreen();
    // No stars for a mission not validated, and home as the main action (no chest).
    expect(screen.queryByRole('image', { name: strings.summary.stars(0) })).toBeNull();
    expect(screen.getByRole('button', { name: strings.summary.bonus })).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { name: strings.summary.home })).toHaveLength(2);
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
        award={{
          status: 'ready',
          award: award({
            badges: ['perfect-1', 'from-the-future'],
            challenge: { code: 'perfect-1', gems: 20 },
            parent_rewards: [{ id: 'cinema', title: 'Une sortie au cinéma' }],
          }),
        }}
        onOpenChest={onOpenChest}
        onOpenBadges={onOpenBadges}
        onBonus={jest.fn()}
        onHome={jest.fn()}
      />,
    );
    // 32 right answers out of 40: 80 %, two stars.
    expect(screen.getByRole('image', { name: strings.summary.stars(2) })).toBeOnTheScreen();
    expect(screen.getByLabelText(strings.summary.xpLabel(340))).toHaveTextContent(/\+340$/);
    expect(screen.getByLabelText(strings.rewards.streakLabel(4))).toHaveTextContent(
      `${strings.summary.tiles.streak}${strings.summary.streakValue(4)}`,
    );
    expect(screen.getByLabelText(strings.summary.gemsLabel(5))).toHaveTextContent(/\+5$/);
    expect(screen.getByText(strings.award.levelUp(5))).toBeOnTheScreen();
    expect(screen.getByText(strings.award.streakUp)).toBeOnTheScreen();
    // The hero next to its chest.
    expect(screen.getByRole('image', { name: strings.summary.chest })).toBeOnTheScreen();
    expect(screen.getByText(strings.award.challengeDone(20))).toBeOnTheScreen();
    expect(screen.getByText(strings.award.parentReward('Une sortie au cinéma'))).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: strings.summary.openChest }));
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

  it('celebrates a mission in the words of the theme', async () => {
    const summary = {
      kind: 'daily' as const,
      goalMet: true,
      answered: 10,
      correct: 9,
      minutes: 15,
      progressed: [],
    };
    for (const theme of Object.values(themes)) {
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
        theme,
      );
      expect(
        screen.getByRole('header', {
          name: strings.themes[theme.id as keyof typeof themes].goalMet,
        }),
      ).toBeOnTheScreen();
      const { cheer } = strings.heroes;
      expect(screen.getByText(cheer[summary.correct % cheer.length] ?? '')).toBeOnTheScreen();
    }
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
