import {
  GAME_DAILY_GEMS,
  GAME_MINUTES_DEFAULT,
  MINI_GAME_IDS,
  companionLook,
  companionStage,
  isMiniGameId,
  type Avatar,
  type Award,
  type CompanionLook,
  type MiniGameId,
} from '@math-genius/shared';

import { rulesOf } from '@/games/catalog';

import type { ChildGames } from './practice/practice-store';

/** What game_room returns (supabase/migrations/*_mini_games.sql). */
export type GameRoomData = {
  localDate: string;
  limitMinutes: number;
  playedS: number;
  gemsToday: number;
  games: { id: MiniGameId; enabled: boolean; bestScore: number | null; bestStars: number }[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const numberOr = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export function parseGameRoom(value: unknown): GameRoomData | null {
  if (!isRecord(value) || typeof value.local_date !== 'string' || !Array.isArray(value.games)) {
    return null;
  }
  return {
    localDate: value.local_date,
    limitMinutes: numberOr(value.limit_minutes, GAME_MINUTES_DEFAULT),
    playedS: numberOr(value.played_s, 0),
    gemsToday: numberOr(value.gems_today, 0),
    games: value.games.flatMap((game) =>
      isRecord(game) && isMiniGameId(game.id)
        ? [
            {
              id: game.id,
              enabled: game.enabled !== false,
              bestScore: typeof game.best_score === 'number' ? game.best_score : null,
              bestStars: numberOr(game.best_stars, 0),
            },
          ]
        : [],
    ),
  };
}

export type GameCard = {
  id: MiniGameId;
  /** False while the game is still to come in this version of the app. */
  ready: boolean;
  record: number | null;
  stars: number;
};

/** open: play; limit: today's time is used up; off: the parent set 0 minutes. */
export type GameRoomState = 'open' | 'limit' | 'off';

export type GameRoomView = {
  state: GameRoomState;
  cards: GameCard[];
  playedMinutes: number;
  limitMinutes: number;
  /** Seconds of play left today. */
  leftS: number;
  gemsToday: number;
  gemsCap: number;
};

/**
 * The game room from the server's view (games turned on, records, today's time and gems) and the
 * device's (rounds not sent yet): the best of both, today only. Offline and never loaded, every
 * game is on and the child's limit applies.
 */
export function gameRoomView(input: {
  server: GameRoomData | null | undefined;
  local: ChildGames | undefined;
  today: string;
  /** The child's limit (children.game_minutes_limit), the server's when it is newer. */
  limitMinutes: number | null | undefined;
}): GameRoomView {
  const server = input.server && input.server.localDate === input.today ? input.server : null;
  const known = new Map((input.server?.games ?? []).map((game) => [game.id, game]));
  const order = input.server?.games.length
    ? input.server.games.map((game) => game.id)
    : MINI_GAME_IDS;
  const limitMinutes = input.limitMinutes ?? input.server?.limitMinutes ?? GAME_MINUTES_DEFAULT;
  const localDay = input.local?.day?.date === input.today ? input.local.day : null;
  const playedS = Math.max(server?.playedS ?? 0, localDay?.playedS ?? 0);
  const leftS = Math.max(0, limitMinutes * 60 - playedS);
  const cards = order
    .filter((id) => known.get(id)?.enabled !== false)
    .map((id) => {
      const fromServer = known.get(id);
      const fromDevice = input.local?.records[id];
      const scores = [fromServer?.bestScore, fromDevice?.score].filter(
        (score): score is number => typeof score === 'number',
      );
      return {
        id,
        ready: rulesOf(id) !== null,
        // A best of 0 is no record yet.
        record: scores.length > 0 && Math.max(...scores) > 0 ? Math.max(...scores) : null,
        stars: Math.max(fromServer?.bestStars ?? 0, fromDevice?.stars ?? 0),
      };
    });
  return {
    state: limitMinutes === 0 ? 'off' : leftS <= 0 ? 'limit' : 'open',
    cards,
    playedMinutes: Math.floor(playedS / 60),
    limitMinutes,
    leftS,
    gemsToday: server?.gemsToday ?? 0,
    gemsCap: GAME_DAILY_GEMS,
  };
}

/** A round never shorter than this, even near the day's limit. */
export const MIN_ROUND_S = 30;

/** How long a round may last: the game's length, or what is left of today's time. */
export const roundLength = (gameSeconds: number, leftS: number) =>
  Math.min(gameSeconds, Math.max(MIN_ROUND_S, leftS));

/** The games' character: the companion the child wears, or the Chouette Galactique (free). */
export const gameCompanion = (avatar: Avatar): CompanionLook =>
  companionLook(avatar) ?? { id: 'hibou', stage: companionStage('hibou') };

/** What the server gave for a round: XP for its right answers, gems up to the day's cap. */
export type GameAward =
  | { status: 'saving' }
  | { status: 'pending' }
  | { status: 'done'; xp: number; gems: number; gemsFull: boolean };

export function gameAwardOf(
  saved: boolean,
  award: Award | null | undefined,
  answered: number,
): GameAward {
  // A round without an answer earns nothing and is never sent.
  if (answered === 0) return { status: 'done', xp: 0, gems: 0, gemsFull: false };
  if (award) {
    const game = award.game;
    return {
      status: 'done',
      xp: award.xp,
      gems: game?.gems ?? 0,
      gemsFull: game !== null && game.gems_today >= game.gems_cap,
    };
  }
  return saved ? { status: 'pending' } : { status: 'saving' };
}
