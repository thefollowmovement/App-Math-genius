import { isMiniGameId, type Database, type MiniGameId } from '@math-genius/shared';

import { moved } from './order';

export type MiniGameRow = Database['public']['Tables']['mini_games']['Row'];
export type MiniGame = MiniGameRow & { id: MiniGameId };

/** The games the back-office knows, in the order the game room shows them. */
export const gameList = (rows: readonly MiniGameRow[]): MiniGame[] =>
  rows
    .filter((row): row is MiniGame => isMiniGameId(row.id))
    .sort((a, b) => a.position - b.position);

/** The positions to write after moving the game at `index`: only those that change. */
export function reorder(
  games: readonly MiniGame[],
  index: number,
  step: -1 | 1,
): { id: MiniGameId; position: number }[] {
  return moved(games, index, step).flatMap((game, at) =>
    game.position === at + 1 ? [] : [{ id: game.id, position: at + 1 }],
  );
}
