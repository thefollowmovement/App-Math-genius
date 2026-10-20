import { generatorId } from './generator';
import { generators } from './generators';
import { buildExercise } from './adaptive/planner';
import { mistakeList } from './diagnose';
import { formatNumber } from './format';
import type { Rational } from './rational';
import {
  SKIPPED_ANSWER,
  type StoredAnswer,
  isSkippedAnswer,
  parseStoredResponse,
  regrade,
} from './regrade';
import { rightResponse, wrongResponse } from './testing/responses';

/** An answer as it comes back from the database: JSON, numbers as plain numerators and denominators. */
const stored = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe('server-side regrading', () => {
  it.each(generators.map((generator) => [generatorId(generator)]))(
    'rebuilds %s from its seed and grades the stored answer again',
    (id) => {
      const answers: StoredAnswer[] = [1, 3, 5].flatMap((difficulty, index) => {
        const exercise = buildExercise({
          generatorId: id,
          difficulty: difficulty as 1 | 3 | 5,
          seed: 100 + index,
        });
        const base = { generator_id: id, difficulty, seed: 100 + index };
        return [
          { ...base, position: index * 2, answer: stored(rightResponse(exercise)) },
          { ...base, position: index * 2 + 1, answer: stored(wrongResponse(exercise)) },
        ];
      });
      expect(regrade(answers).map((verdict) => verdict.correct)).toEqual([
        true,
        false,
        true,
        false,
        true,
        false,
      ]);
    },
  );

  it('cannot vouch for an exercise this engine does not know', () => {
    const base = { position: 0, seed: 1, answer: { type: 'numeric', text: '12' } };
    expect(regrade([{ ...base, generator_id: 'ce2.removed', difficulty: 2 }])).toEqual([
      { position: 0, correct: null, error: null },
    ]);
    expect(
      regrade([{ ...base, generator_id: generatorId(generators[0]!), difficulty: 9 }]),
    ).toEqual([{ position: 0, correct: null, error: null }]);
  });

  it('names the typical mistake behind a wrong answer', () => {
    const generator = generators.find((candidate) => candidate.skill === 'ce2.addition-posee');
    if (!generator) throw new Error('no addition generator');
    const id = generatorId(generator);
    // An addition that needs a carry, answered without it.
    const stored = (seed: number, text: string) => ({
      position: seed,
      generator_id: id,
      difficulty: 3,
      seed,
      answer: { type: 'numeric', text },
    });
    const exercise = Array.from({ length: 50 }, (_, seed) =>
      buildExercise({ generatorId: id, difficulty: 3, seed }),
    ).find((candidate) => candidate.type === 'numeric' && mistakeList(candidate).length > 0);
    if (!exercise) throw new Error('no addition with a carry');
    const [mistake] = mistakeList(exercise);
    const text = formatNumber(mistake?.answer as Rational);
    expect(regrade([stored(exercise.seed, text)])).toEqual([
      { position: exercise.seed, correct: false, error: 'forgot-carry' },
    ]);
  });

  it('marks an answer of an unknown shape as wrong', () => {
    const id = generatorId(generators[0]!);
    expect(
      regrade([{ position: 3, generator_id: id, difficulty: 2, seed: 5, answer: { type: 'x' } }]),
    ).toEqual([{ position: 3, correct: false, error: null }]);
  });

  it('marks « Je ne sais pas » as wrong', () => {
    const id = generatorId(generators[0]!);
    const answer = stored(SKIPPED_ANSWER);
    expect(isSkippedAnswer(answer)).toBe(true);
    expect(regrade([{ position: 0, generator_id: id, difficulty: 2, seed: 5, answer }])).toEqual([
      { position: 0, correct: false, error: null },
    ]);
  });

  it('reads every stored response shape', () => {
    expect(parseStoredResponse({ type: 'number-line', value: { num: 6, den: 8 } })).toEqual({
      type: 'number-line',
      value: { num: 3, den: 4 },
    });
    for (const value of [
      null,
      3,
      'text',
      [],
      { type: 'numeric' },
      { type: 'order', order: ['a'] },
    ]) {
      expect(parseStoredResponse(value)).toBeNull();
    }
    expect(parseStoredResponse({ type: 'number-line', value: { num: 1, den: 0 } })).toBeNull();
  });
});
