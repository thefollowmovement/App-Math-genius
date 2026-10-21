import type { SkillCode } from '@math-genius/curriculum';

import type { Difficulty } from '../exercise';

/**
 * Session rules shared with the server: `sync_session` (supabase/migrations) recomputes the
 * same active time, success rate, goal and flag from the attempts. Keep both in step.
 */

/** Share of a session: skill being learnt, spaced review, timed mental calculation, challenge. */
export type Slot = 'current' | 'review' | 'automatism' | 'challenge';

export type SessionGoal = { type: 'duration'; minutes: number } | { type: 'count'; count: number };

/** Until routines exist (phase 4), every session aims at 15 minutes. */
export const DEFAULT_SESSION_GOAL: SessionGoal = { type: 'duration', minutes: 15 };

/** Faster answers do not count toward a goal and suggest random tapping. */
export const MIN_ANSWER_MS = 1200;
/** Longer pauses between two answers count as this much active time (the child left). */
export const MAX_GAP_MS = 120_000;
/** A session counts only with at least 60 % success (anti-cheat, docs/specs.md). */
export const MIN_SUCCESS_RATE = 0.6;
/** Below 60 % at the goal, the session goes on, easier, up to 1.5 times the goal. */
export const OVERTIME = 1.5;
/**
 * The day's mini-game rounds count in its daily session for 30 % of the goal at most
 * (docs/design/mini-jeux.md): of its minutes, or of its exercises.
 */
export const GAME_SHARE_PERCENT = 30;
/** Flag: at least 5 answers, and 30 % of them, faster than `MIN_ANSWER_MS`. */
const FLAG_MIN_FAST = 5;
const FLAG_FAST_SHARE = 0.3;

/** One answered exercise, as kept on the device and sent to the server. */
export type SessionAttempt = {
  generatorId: string;
  skill: SkillCode;
  difficulty: Difficulty;
  seed: number;
  slot: Slot;
  /** Index of the failed attempt this exercise repeats with new numbers. */
  twinOf: number | null;
  /** Easier exercise shown with a reminder after errors in a row. */
  reminder: boolean;
  correct: boolean;
  hintUsed: boolean;
  /** From display to answer. */
  timeMs: number;
  /** ISO date. */
  answeredAt: string;
  /** Child's rating on the skill before answering, for the server's item calibration. */
  learnerElo: number;
};

type Timed = Pick<SessionAttempt, 'answeredAt'>;

/** Time spent in the session up to the last answer, idle pauses capped. */
export function activeMs(startedAt: string, attempts: readonly Timed[]): number {
  let previous = Date.parse(startedAt);
  let total = 0;
  for (const attempt of attempts) {
    const at = Date.parse(attempt.answeredAt);
    total += Math.min(MAX_GAP_MS, Math.max(0, at - previous));
    previous = Math.max(previous, at);
  }
  return total;
}

/** What the day's finished mini-game rounds bring to its daily session, before the cap. */
export type GameCredit = {
  activeMs: number;
  /** Answers not too fast to count, as for a count goal. */
  answers: number;
};

export const NO_GAME_CREDIT: GameCredit = { activeMs: 0, answers: 0 };

type Round = {
  startedAt: string;
  attempts: readonly Pick<SessionAttempt, 'answeredAt' | 'timeMs'>[];
};

/** Rounds played that day before the daily session ends, measured like a session. */
export function gameCredit(rounds: readonly Round[]): GameCredit {
  return rounds.reduce<GameCredit>(
    (total, round) => ({
      activeMs: total.activeMs + activeMs(round.startedAt, round.attempts),
      answers:
        total.answers + round.attempts.filter((attempt) => attempt.timeMs >= MIN_ANSWER_MS).length,
    }),
    NO_GAME_CREDIT,
  );
}

export type SessionProgress = {
  answered: number;
  correct: number;
  /** 0 to 1; 0 before the first answer. */
  successRate: number;
  activeMs: number;
  /** Share of the goal done, from 0 (can exceed 1 in overtime), the games' share included. */
  progress: number;
  /** What the games brought, capped: milliseconds for a duration goal, answers for a count. */
  fromGames: number;
  goalReached: boolean;
  /** Goal reached with at least 60 % success: the session counts. */
  goalMet: boolean;
  /** Time to stop: goal met, or overtime used up. */
  finished: boolean;
  /** Many answers faster than reading allows: the parent will be told, nothing more. */
  flagged: boolean;
};

export function sessionProgress(
  goal: SessionGoal,
  startedAt: string,
  attempts: readonly Pick<SessionAttempt, 'answeredAt' | 'correct' | 'timeMs'>[],
  games: GameCredit = NO_GAME_CREDIT,
): SessionProgress {
  const answered = attempts.length;
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const fast = attempts.filter((attempt) => attempt.timeMs < MIN_ANSWER_MS).length;
  const active = activeMs(startedAt, attempts);
  const goalMs = goal.type === 'duration' ? goal.minutes * 60_000 : 0;
  const fromGames =
    goal.type === 'duration'
      ? Math.min(games.activeMs, (goalMs * GAME_SHARE_PERCENT) / 100)
      : Math.min(games.answers, Math.floor((goal.count * GAME_SHARE_PERCENT) / 100));
  const progress =
    goal.type === 'duration'
      ? (active + fromGames) / goalMs
      : (answered - fast + fromGames) / goal.count;
  const successRate = answered === 0 ? 0 : correct / answered;
  const goalReached = progress >= 1;
  const goalMet = goalReached && successRate >= MIN_SUCCESS_RATE;

  return {
    answered,
    correct,
    successRate,
    activeMs: active,
    progress,
    fromGames,
    goalReached,
    goalMet,
    finished: goalMet || progress >= OVERTIME,
    flagged: fast >= FLAG_MIN_FAST && fast >= FLAG_FAST_SHARE * answered,
  };
}
