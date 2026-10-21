import type { GameQuestionRequest } from '@math-genius/exercise-engine';
import { GAME_STARS_MAX, type MiniGameId } from '@math-genius/shared';

import type { Background } from './kit/art';

/**
 * The rules every mini-game follows (docs/design/mini-jeux.md): a score, 1 to 3 stars, a personal
 * record and no ranking. A game is a module with the same interface: `start` opens the round,
 * `onAnswer` takes each answer graded by the engine, `onEnd` gives the score and the stars. Its
 * scene (`scenes.tsx`) is what the child plays; these rules are pure and tested.
 */

/** What the round keeps on the JS thread: what the screen shows and the end tells. */
export type RoundState = {
  score: number;
  /** Right answers in a row. */
  combo: number;
  right: number;
  answered: number;
  /** Null for a game without hearts. */
  hearts: number | null;
};

/** An answer graded by the engine, with the time from the question to it (pauses left out). */
export type GameAnswer = { correct: boolean; timeMs: number };

export type GameResult = { score: number; stars: number };

export type GameRules = {
  id: MiniGameId;
  /** What it asks of the engine (packages/exercise-engine/src/games). */
  question: GameQuestionRequest;
  background: Background;
  /** A round lasts this long at most (1 to 3 minutes). */
  seconds: number;
  /** Hearts to lose before the round ends, or none. */
  hearts: number | null;
  /** Score for 1, 2 and 3 stars. */
  stars: readonly [number, number, number];
  /** « Pêcher ! » is a button; the other games are played on the scene itself. */
  action: 'fish' | null;
  start(): RoundState;
  onAnswer(state: RoundState, answer: GameAnswer): RoundState;
  onEnd(state: RoundState): GameResult;
};

export const newRound = (hearts: number | null): RoundState => ({
  score: 0,
  combo: 0,
  right: 0,
  answered: 0,
  hearts,
});

/** All of `bonus` under `fastMs`, nothing past `slowMs`, in between in proportion. */
export function speedBonus(timeMs: number, bonus: number, fastMs: number, slowMs: number): number {
  if (timeMs <= fastMs) return bonus;
  if (timeMs >= slowMs) return 0;
  return Math.round((bonus * (slowMs - timeMs)) / (slowMs - fastMs));
}

/** A right answer and its points; a combo of 3 or more adds a tenth for each answer in a row. */
export function rightAnswer(state: RoundState, points: number): RoundState {
  const combo = state.combo + 1;
  const comboBonus = combo >= 3 ? Math.round(points * 0.1 * (combo - 2)) : 0;
  return {
    ...state,
    score: state.score + points + comboBonus,
    combo,
    right: state.right + 1,
    answered: state.answered + 1,
  };
}

/** A wrong answer costs no points: the combo starts again. */
export const wrongAnswer = (state: RoundState): RoundState => ({
  ...state,
  combo: 0,
  answered: state.answered + 1,
});

export const addPoints = (state: RoundState, points: number): RoundState => ({
  ...state,
  score: state.score + points,
});

/** One heart less; the round ends at none. */
export const hurt = (state: RoundState): RoundState =>
  state.hearts === null ? state : { ...state, hearts: Math.max(0, state.hearts - 1) };

export const outOfHearts = (state: RoundState) => state.hearts !== null && state.hearts <= 0;

export function starsOf(score: number, thresholds: readonly number[]): number {
  return Math.min(GAME_STARS_MAX, thresholds.filter((threshold) => score >= threshold).length);
}

/** The usual end: the score as it stands and its stars. */
export const endOf =
  (stars: readonly number[]) =>
  (state: RoundState): GameResult => ({ score: state.score, stars: starsOf(state.score, stars) });
