import { endOf, newRound, rightAnswer, speedBonus, wrongAnswer, type GameRules } from '../round';

const STARS = [300, 700, 1100] as const;

/** Pêche éclair: 100 points a right fish, up to 50 more for a quick catch. */
export const fishingRules: GameRules = {
  id: 'peche-eclair',
  question: { kind: 'choices', count: 3 },
  background: 'peche',
  seconds: 90,
  hearts: null,
  stars: STARS,
  action: 'fish',
  start: () => newRound(null),
  onAnswer: (state, answer) =>
    answer.correct
      ? rightAnswer(state, 100 + speedBonus(answer.timeMs, 50, 4000, 12000))
      : wrongAnswer(state),
  onEnd: endOf(STARS),
};
