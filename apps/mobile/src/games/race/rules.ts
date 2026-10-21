import { endOf, newRound, rightAnswer, wrongAnswer, type GameRules } from '../round';

const STARS = [500, 1100, 1700] as const;

/** Course des croquettes: 100 points the right door, 10 a croquette; no hearts to lose. */
export const raceRules: GameRules = {
  id: 'course-des-croquettes',
  question: { kind: 'choices', count: 3 },
  background: 'pluie',
  seconds: 90,
  hearts: null,
  stars: STARS,
  action: null,
  retry: false,
  nextDelayMs: 500,
  start: () => newRound(null),
  onAnswer: (state, answer) => (answer.correct ? rightAnswer(state, 100) : wrongAnswer(state)),
  onEnd: endOf(STARS),
};
