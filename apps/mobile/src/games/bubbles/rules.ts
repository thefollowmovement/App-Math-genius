import { endOf, newRound, rightAnswer, speedBonus, wrongAnswer, type GameRules } from '../round';

const STARS = [300, 700, 1100] as const;

/**
 * Bulles magiques: 100 points the right pair of bubbles, up to 50 more found quickly. A wrong pair
 * costs nothing but the combo: the same bubbles keep rising, try again.
 */
export const bubblesRules: GameRules = {
  id: 'bulles-magiques',
  question: { kind: 'sum', count: 6 },
  background: 'pluie',
  seconds: 90,
  hearts: null,
  stars: STARS,
  action: null,
  retry: true,
  nextDelayMs: 700,
  start: () => newRound(null),
  onAnswer: (state, answer) =>
    answer.correct
      ? rightAnswer(state, 100 + speedBonus(answer.timeMs, 50, 4000, 12000))
      : wrongAnswer(state),
  onEnd: endOf(STARS),
};
