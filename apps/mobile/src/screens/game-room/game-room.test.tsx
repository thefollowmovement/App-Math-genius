import { screen, userEvent } from '@testing-library/react-native';

import { gameRoomView } from '@/data/games-model';
import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { GameRoom } from '.';

const t = strings.games;
const TODAY = '2026-10-21';
const hibou = { id: 'hibou', stage: 1 } as const;

describe('GameRoom', () => {
  it('shows each game with its record and stars, and opens it', async () => {
    const user = userEvent.setup();
    const onPlay = jest.fn();
    const view = gameRoomView({
      server: undefined,
      local: { records: { 'peche-eclair': { score: 640, stars: 2 } }, day: null },
      today: TODAY,
      limitMinutes: 20,
    });
    await renderWithTheme(<GameRoom view={view} companion={hibou} onPlay={onPlay} />);
    expect(screen.getByRole('header', { name: t.room.title })).toBeOnTheScreen();
    expect(screen.getByText(t.room.intro('Chouette Galactique'))).toBeOnTheScreen();
    expect(screen.getByText(t.room.record(640))).toBeOnTheScreen();
    expect(screen.getByLabelText(t.room.stars(2))).toBeOnTheScreen();
    await user.press(
      screen.getByRole('button', { name: t.room.play(t.items['vol-du-chaton'].name) }),
    );
    expect(onPlay).toHaveBeenCalledWith('vol-du-chaton');
    // The games still to come are there, not playable yet.
    expect(screen.getAllByRole('button', { name: t.room.soon }).length).toBe(3);
  });

  it('says when today’s time is up, and plays nothing more', async () => {
    const onPlay = jest.fn();
    const view = gameRoomView({
      server: undefined,
      local: { records: {}, day: { date: TODAY, playedS: 1200, activeMs: 0, answers: 0 } },
      today: TODAY,
      limitMinutes: 20,
    });
    await renderWithTheme(<GameRoom view={view} companion={hibou} onPlay={onPlay} />);
    expect(screen.getByText(t.room.limitReached)).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: t.room.play(t.items['peche-eclair'].name) }),
    ).toBeDisabled();
  });
});
