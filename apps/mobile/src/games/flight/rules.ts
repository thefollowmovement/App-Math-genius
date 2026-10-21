import { endOf, newRound, rightAnswer, wrongAnswer, type GameRules } from '../round';

const STARS = [300, 700, 1100] as const;

/** Vol du Chaton: 10 points a pillar, 100 the right passage of a gate; 3 hearts. */
export const flightRules: GameRules = {
  id: 'vol-du-chaton',
  question: { kind: 'choices', count: 2 },
  background: 'vol',
  seconds: 90,
  hearts: 3,
  stars: STARS,
  action: null,
  retry: false,
  nextDelayMs: 0,
  start: () => newRound(3),
  onAnswer: (state, answer) => (answer.correct ? rightAnswer(state, 100) : wrongAnswer(state)),
  onEnd: endOf(STARS),
};
