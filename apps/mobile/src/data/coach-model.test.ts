import { coachSample, type Explanation } from '@math-genius/exercise-engine';

import { coachExplanation, coachRequest } from './coach-model';

const sample = coachSample('ce2.addition-posee', 'forgot-carry');
if (!sample) throw new Error('no sample');
const { exercise, response } = sample;

const TEMPLATE: Explanation = {
  what: 'Tu as écrit {reponse} : la retenue s’est envolée !',
  image: 'Une rangée pleine de blocs passe à la colonne d’à côté.',
  tip: 'Garde la retenue : {n1} + {n2} = {solution}.',
};

describe('the coach’s explanation, as the app shows it', () => {
  it('sends the exercise as its generator, difficulty and seed, never its text', () => {
    expect(coachRequest('child-1', exercise, response, ['seen'])).toEqual({
      task: 'explain',
      child_id: 'child-1',
      generator_id: exercise.generatorId,
      difficulty: exercise.difficulty,
      seed: exercise.seed,
      response,
      exclude: ['seen'],
    });
  });

  it('renders the template with the exercise’s own numbers', () => {
    const shown = coachExplanation(
      { source: 'cache', id: 'e1', template: TEMPLATE, explanation: { what: 'ignored' } },
      exercise,
      response,
    );
    expect(shown?.id).toBe('e1');
    expect(shown?.explanation.tip).toContain(exercise.explanation.at(-1)?.split(' = ')[1] ?? '?');
    expect(shown?.explanation.what).not.toContain('{');
  });

  it('never shows numbers that are not the exercise’s, whatever the server says', () => {
    const lying = { ...TEMPLATE, tip: 'Garde la retenue : 687 + 39 = 716.' };
    expect(
      coachExplanation({ source: 'ai', id: 'e2', template: lying }, exercise, response),
    ).toBeNull();
    const unknown = { ...TEMPLATE, tip: 'Regarde {n9}.' };
    expect(
      coachExplanation({ source: 'ai', id: 'e3', template: unknown }, exercise, response),
    ).toBeNull();
  });

  it('falls back on the generator’s correction for anything else', () => {
    expect(coachExplanation({ source: 'standard', reason: 'off' }, exercise, response)).toBeNull();
    expect(
      coachExplanation({ source: 'ai', id: 4, template: TEMPLATE }, exercise, response),
    ).toBeNull();
    expect(
      coachExplanation({ source: 'ai', id: 'e5', template: { what: 'a' } }, exercise, response),
    ).toBeNull();
    expect(coachExplanation(null, exercise, response)).toBeNull();
  });
});
