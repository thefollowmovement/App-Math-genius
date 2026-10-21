import {
  endOf,
  hurt,
  newRound,
  rightAnswer,
  speedBonus,
  wrongAnswer,
  type GameRules,
} from '../round';

const STARS = [300, 800, 1300] as const;

/**
 * Pluie de gemmes: 100 points the right gem (30 more caught quickly), 10 a croquette. A wrong gem
 * turns into a bomb: like a bomb, it costs one of the 3 hearts.
 */
export const gemRainRules: GameRules = {
  id: 'pluie-de-gemmes',
  question: { kind: 'choices', count: 3 },
  background: 'pluie',
  seconds: 90,
  hearts: 3,
  stars: STARS,
  action: null,
  start: () => newRound(3),
  onAnswer: (state, answer) =>
    answer.correct
      ? rightAnswer(state, 100 + speedBonus(answer.timeMs, 30, 3000, 8000))
      : hurt(wrongAnswer(state)),
  onEnd: endOf(STARS),
};
