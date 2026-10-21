import { gameList, reorder, type MiniGameRow } from './games';

const row = (id: string, position: number, enabled = true): MiniGameRow => ({
  id,
  position,
  enabled,
  created_at: '2026-10-21T00:00:00Z',
  updated_at: '2026-10-21T00:00:00Z',
});

describe('the mini-games of the back-office', () => {
  const rows = [
    row('vol-du-chaton', 3),
    row('peche-eclair', 1),
    row('tetris', 2),
    row('pluie-de-gemmes', 2, false),
  ];

  it('lists the games the app knows, in the room’s order', () => {
    expect(gameList(rows).map((game) => game.id)).toEqual([
      'peche-eclair',
      'pluie-de-gemmes',
      'vol-du-chaton',
    ]);
  });

  it('moves a game, writing only the positions that change', () => {
    const games = gameList(rows);
    expect(reorder(games, 2, -1)).toEqual([
      { id: 'vol-du-chaton', position: 2 },
      { id: 'pluie-de-gemmes', position: 3 },
    ]);
    expect(reorder(games, 0, -1)).toEqual([]);
  });
});
