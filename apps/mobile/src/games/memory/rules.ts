import { endOf, newRound, rightAnswer, speedBonus, wrongAnswer, type GameRules } from '../round';

const STARS = [400, 1000, 1800] as const;

/**
 * Memory du compagnon: 6 pairs a board, 100 points a pair (up to 30 more found quickly), 200 a
 * board cleared. Only a pairing of two cards already seen counts as a wrong answer: turning two
 * new cards is a guess, not a mistake in maths.
 */
export const memoryRules: GameRules = {
  id: 'memory-du-compagnon',
  question: { kind: 'pair' },
  background: 'pluie',
  seconds: 120,
  hearts: null,
  stars: STARS,
  action: null,
  retry: false,
  nextDelayMs: 900,
  board: 6,
  boardBonus: 200,
  start: () => newRound(null),
  onAnswer: (state, answer) =>
    answer.correct
      ? rightAnswer(state, 100 + speedBonus(answer.timeMs, 30, 3000, 10000))
      : wrongAnswer(state),
  onEnd: endOf(STARS),
};
