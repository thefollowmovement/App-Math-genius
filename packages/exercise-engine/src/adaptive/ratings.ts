import { DIFFICULTIES, type Difficulty } from '../exercise';

/**
 * Elo-style ratings: every child has a rating per skill, every item (generator × difficulty) has
 * a difficulty rating, and each answer moves both. The server applies the item side with the same
 * constants (`sync_session` in supabase/migrations): keep them in step.
 */

/** Starting rating of an item, before any child has answered it. */
export const DIFFICULTY_RATINGS: Readonly<Record<Difficulty, number>> = {
  1: 800,
  2: 1000,
  3: 1200,
  4: 1400,
  5: 1600,
};

/** Calibrated item ratings, keyed by `itemKey`. Missing items use `DIFFICULTY_RATINGS`. */
export type ItemRatings = Readonly<Record<string, number>>;

/** Success rate the session aims for (75 to 85 % in docs/specs.md). */
export const TARGET_SUCCESS = 0.8;

/** How far an item moves per answer: slowly, since it learns from every child. */
export const ITEM_K = 4;

export const itemKey = (generatorId: string, difficulty: Difficulty) =>
  `${generatorId}:${difficulty}`;

export const itemRating = (ratings: ItemRatings, generatorId: string, difficulty: Difficulty) =>
  ratings[itemKey(generatorId, difficulty)] ?? DIFFICULTY_RATINGS[difficulty];

/** Probability that a child with `learner` rating succeeds on an item rated `item`. */
export const expectedSuccess = (learner: number, item: number) =>
  1 / (1 + 10 ** ((item - learner) / 400));

/** A child's rating moves fast on a new skill, then settles. */
export const learnerK = (attempts: number) => Math.max(24, 64 - 4 * attempts);

/** New ratings of the child (on this skill) and of the item after one answer. */
export function updateRatings(input: {
  learner: number;
  item: number;
  correct: boolean;
  learnerAttempts: number;
}): { learner: number; item: number } {
  const expected = expectedSuccess(input.learner, input.item);
  const actual = input.correct ? 1 : 0;
  return {
    learner: input.learner + learnerK(input.learnerAttempts) * (actual - expected),
    item: input.item + ITEM_K * (expected - actual),
  };
}

/** Missing the target from below (too hard) weighs this much more than from above. */
const TOO_HARD_WEIGHT = 2;

/**
 * Difficulty whose expected success is closest to the target. Levels are 200 points apart, so
 * a child between two levels gets the easier one unless the harder one is clearly closer.
 */
export function difficultyFor(learner: number, ratingOf: (difficulty: Difficulty) => number) {
  const gap = (difficulty: Difficulty) => {
    const miss = expectedSuccess(learner, ratingOf(difficulty)) - TARGET_SUCCESS;
    return miss < 0 ? -miss * TOO_HARD_WEIGHT : miss;
  };
  return DIFFICULTIES.reduce((best, difficulty) =>
    gap(difficulty) < gap(best) ? difficulty : best,
  );
}

export const clampDifficulty = (value: number): Difficulty =>
  Math.min(5, Math.max(1, Math.round(value))) as Difficulty;
