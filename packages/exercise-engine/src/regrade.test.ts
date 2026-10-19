import { generatorId } from './generator';
import { generators } from './generators';
import { buildExercise } from './adaptive/planner';
import { type StoredAnswer, parseStoredResponse, regrade } from './regrade';
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
      { position: 0, correct: null },
    ]);
    expect(
      regrade([{ ...base, generator_id: generatorId(generators[0]!), difficulty: 9 }]),
    ).toEqual([{ position: 0, correct: null }]);
  });

  it('marks an answer of an unknown shape as wrong', () => {
    const id = generatorId(generators[0]!);
    expect(
      regrade([{ position: 3, generator_id: id, difficulty: 2, seed: 5, answer: { type: 'x' } }]),
    ).toEqual([{ position: 3, correct: false }]);
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
