/**
 * The companion's mini-games (docs/design/mini-jeux.md). The ids are stored (sessions.game_id,
 * mini_games): never rename them. The migration *_mini_games.sql writes the same list and applies
 * the same gem rules (games.test.ts and games.test.sql share the same case): change both.
 */

export const MINI_GAME_IDS = [
  'peche-eclair',
  'pluie-de-gemmes',
  'vol-du-chaton',
  'bulles-magiques',
  'memory-du-compagnon',
  'course-des-croquettes',
] as const;

export type MiniGameId = (typeof MINI_GAME_IDS)[number];

export const isMiniGameId = (value: unknown): value is MiniGameId =>
  MINI_GAME_IDS.some((id) => id === value);

/** Gems the games earn in a day, at most: they never replace the daily session. */
export const GAME_DAILY_GEMS = 20;
/** One gem every 3 right answers of a round (by the server's grading, not too fast to count). */
export const GAME_ANSWERS_PER_GEM = 3;

/** What a round earns, once the day's earlier rounds have earned `earnedToday`. */
export const gameGems = (countedRight: number, earnedToday: number): number =>
  Math.max(
    0,
    Math.min(Math.floor(countedRight / GAME_ANSWERS_PER_GEM), GAME_DAILY_GEMS - earnedToday),
  );

/** Playing time a day set by the parent (children.game_minutes_limit); 0 turns the games off. */
export const GAME_MINUTES_DEFAULT = 20;
export const GAME_MINUTES_MAX = 120;
export const GAME_MINUTES_CHOICES = [0, 10, 15, 20, 30, 45, 60] as const;

/** A round counts this much playing time at most, even left open (game_room in the migration). */
export const GAME_ROUND_MAX_SECONDS = 240;

export const GAME_STARS_MAX = 3;
