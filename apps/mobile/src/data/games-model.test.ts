import { award } from '@/test-utils/rewards';

import {
  gameAwardOf,
  gameCompanion,
  gameRoomView,
  parseGameRoom,
  roundLength,
  type GameRoomData,
} from './games-model';

const TODAY = '2026-10-21';
const server: GameRoomData = parseGameRoom({
  local_date: TODAY,
  limit_minutes: 20,
  played_s: 300,
  gems_today: 6,
  games: [
    { id: 'peche-eclair', enabled: true, best_score: 900, best_stars: 2, rounds: 4 },
    { id: 'pluie-de-gemmes', enabled: false, best_score: null, best_stars: 0, rounds: 0 },
    { id: 'vol-du-chaton', enabled: true, best_score: 200, best_stars: 0, rounds: 1 },
    { id: 'bulles-magiques', enabled: true, best_score: null, best_stars: 0, rounds: 0 },
    { id: 'tetris', enabled: true },
  ],
}) as GameRoomData;

describe('the game room', () => {
  it('reads game_room, leaving out what the app does not know', () => {
    expect(server.games.map((game) => game.id)).toEqual([
      'peche-eclair',
      'pluie-de-gemmes',
      'vol-du-chaton',
      'bulles-magiques',
    ]);
    expect(parseGameRoom(null)).toBeNull();
  });

  it('hides the games the team turned off, and keeps the best records of the server and the device', () => {
    const view = gameRoomView({
      server,
      local: { records: { 'vol-du-chaton': { score: 450, stars: 1 } }, day: null },
      today: TODAY,
      limitMinutes: 20,
    });
    expect(view.cards).toEqual([
      { id: 'peche-eclair', record: 900, stars: 2 },
      { id: 'vol-du-chaton', record: 450, stars: 1 },
      { id: 'bulles-magiques', record: null, stars: 0 },
    ]);
    expect(view).toMatchObject({ state: 'open', playedMinutes: 5, leftS: 900, gemsToday: 6 });
  });

  it('counts today’s time from the device too, and closes at the limit', () => {
    const local = { records: {}, day: { date: TODAY, playedS: 1200, activeMs: 0, answers: 0 } };
    expect(gameRoomView({ server, local, today: TODAY, limitMinutes: 20 })).toMatchObject({
      state: 'limit',
      leftS: 0,
    });
    // Yesterday's rounds do not count.
    expect(
      gameRoomView({
        server: { ...server, localDate: '2026-10-20' },
        local: undefined,
        today: TODAY,
        limitMinutes: 20,
      }),
    ).toMatchObject({ state: 'open', playedMinutes: 0, gemsToday: 0 });
    expect(gameRoomView({ server, local: undefined, today: TODAY, limitMinutes: 0 }).state).toBe(
      'off',
    );
  });

  it('opens every game offline, before the server ever answered', () => {
    const view = gameRoomView({
      server: undefined,
      local: undefined,
      today: TODAY,
      limitMinutes: undefined,
    });
    expect(view.cards).toHaveLength(6);
    expect(view).toMatchObject({ state: 'open', limitMinutes: 20 });
  });

  it('shortens the last round of the day, never under 30 seconds', () => {
    expect(roundLength(90, 600)).toBe(90);
    expect(roundLength(90, 50)).toBe(50);
    expect(roundLength(90, 5)).toBe(30);
  });

  it('plays with the companion worn, the Chouette Galactique otherwise', () => {
    expect(gameCompanion({ hero: 'nova', wear: { companion: 'dragon' } }).id).toBe('dragon');
    expect(gameCompanion({ hero: 'nova', wear: {} }).id).toBe('hibou');
  });

  it('tells the round’s rewards once the server gave them', () => {
    expect(gameAwardOf(false, null, 3)).toEqual({ status: 'saving' });
    expect(gameAwardOf(true, null, 0)).toEqual({ status: 'done', xp: 0, gems: 0, gemsFull: false });
    expect(gameAwardOf(true, null, 3)).toEqual({ status: 'pending' });
    expect(
      gameAwardOf(
        true,
        award({
          xp: 60,
          gems: 0,
          game: { id: 'peche-eclair', gems: 2, gems_today: 20, gems_cap: 20 },
        }),
        6,
      ),
    ).toEqual({ status: 'done', xp: 60, gems: 2, gemsFull: true });
  });
});
