import {
  DIFFICULTY_RATINGS,
  TARGET_SUCCESS,
  clampDifficulty,
  difficultyFor,
  expectedSuccess,
  itemRating,
  learnerK,
  updateRatings,
} from './ratings';

const defaultRating = (difficulty: 1 | 2 | 3 | 4 | 5) => DIFFICULTY_RATINGS[difficulty];

describe('ratings', () => {
  it('expects 50 % between equals and more against easier items', () => {
    expect(expectedSuccess(1200, 1200)).toBeCloseTo(0.5);
    expect(expectedSuccess(1440, 1200)).toBeCloseTo(0.8, 2);
    expect(expectedSuccess(1000, 1200) + expectedSuccess(1200, 1000)).toBeCloseTo(1);
  });

  it('moves the child and the item in opposite directions', () => {
    const success = updateRatings({ learner: 1200, item: 1200, correct: true, learnerAttempts: 0 });
    expect(success.learner).toBeCloseTo(1232);
    expect(success.item).toBeCloseTo(1198);

    const failure = updateRatings({
      learner: 1200,
      item: 1200,
      correct: false,
      learnerAttempts: 10,
    });
    expect(failure.learner).toBeCloseTo(1188);
    expect(failure.item).toBeCloseTo(1202);
  });

  it('settles the child rating after the first answers', () => {
    expect(learnerK(0)).toBe(64);
    expect(learnerK(5)).toBe(44);
    expect(learnerK(10)).toBe(24);
    expect(learnerK(200)).toBe(24);
  });

  it('picks the difficulty closest to 80 % expected success', () => {
    expect(difficultyFor(600, defaultRating)).toBe(1);
    expect(difficultyFor(1240, defaultRating)).toBe(2);
    expect(difficultyFor(1440, defaultRating)).toBe(3);
    expect(difficultyFor(2400, defaultRating)).toBe(5);
    const chosen = difficultyFor(1440, defaultRating);
    expect(expectedSuccess(1440, defaultRating(chosen))).toBeCloseTo(TARGET_SUCCESS, 2);
  });

  it('uses calibrated item ratings when the server has some', () => {
    expect(itemRating({}, 'ce2.tables-multiplication', 3)).toBe(1200);
    expect(
      itemRating({ 'ce2.tables-multiplication:3': 1310 }, 'ce2.tables-multiplication', 3),
    ).toBe(1310);
    const harder = (difficulty: 1 | 2 | 3 | 4 | 5) => defaultRating(difficulty) + 200;
    expect(difficultyFor(1440, harder)).toBe(2);
  });

  it('clamps difficulties to 1–5', () => {
    expect(clampDifficulty(-1)).toBe(1);
    expect(clampDifficulty(3)).toBe(3);
    expect(clampDifficulty(7)).toBe(5);
  });
});
