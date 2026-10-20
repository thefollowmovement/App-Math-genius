import { coachSample } from '@math-genius/exercise-engine';

import { parseCoachRequest, parsePreviewRequest } from './request';

const CHILD = '00000000-0000-4000-8000-0000000000c1';

describe('the app’s request after a mistake', () => {
  const sample = coachSample('ce2.addition-posee', 'forgot-carry');
  const body = {
    child_id: CHILD,
    generator_id: sample?.exercise.generatorId,
    difficulty: sample?.exercise.difficulty,
    seed: sample?.exercise.seed,
    response: sample?.response,
    exclude: ['00000000-0000-4000-8000-000000000e01', 'not-an-id'],
  };

  it('rebuilds the exercise on the server and keeps the child’s answer', () => {
    const request = parseCoachRequest(body);
    expect(request?.exercise.prompt).toBe(sample?.exercise.prompt);
    expect(request?.response).toEqual(sample?.response);
    expect(request?.exclude).toEqual(['00000000-0000-4000-8000-000000000e01']);
  });

  it('refuses what it cannot rebuild or read', () => {
    expect(parseCoachRequest({ ...body, child_id: 'lea' })).toBeNull();
    expect(parseCoachRequest({ ...body, generator_id: 'retired.generator' })).toBeNull();
    expect(parseCoachRequest({ ...body, response: { type: 'choice', index: 1 } })).toBeNull();
    expect(parseCoachRequest(null)).toBeNull();
  });
});

describe('the back-office’s prompt test', () => {
  const body = {
    skill: 'cm1.perimetre',
    error: 'area-perimeter',
    universe: 'minecraft',
    band: 'cm1-cm2',
    system: 'Tu es le coach.',
    user: 'Exercice : {{exercice}}',
    version: 3,
  };

  it('reads the prompt being written, the mistake and the age group', () => {
    expect(parsePreviewRequest(body)).toEqual({
      skill: 'cm1.perimetre',
      error: 'area-perimeter',
      universe: 'minecraft',
      band: 'cm1-cm2',
      prompt: { version: 3, system: 'Tu es le coach.', user: 'Exercice : {{exercice}}' },
      night: false,
    });
    expect(parsePreviewRequest({ ...body, error: null, universe: '', version: 'x' })).toMatchObject(
      {
        error: null,
        universe: null,
        prompt: { version: 0 },
      },
    );
  });

  it('refuses an unknown skill, mistake or age group, and an empty prompt', () => {
    expect(parsePreviewRequest({ ...body, skill: 'cm1.inconnue' })).toBeNull();
    expect(parsePreviewRequest({ ...body, error: 'made-up' })).toBeNull();
    expect(parsePreviewRequest({ ...body, band: 'lycee' })).toBeNull();
    expect(parsePreviewRequest({ ...body, system: '  ' })).toBeNull();
    expect(parsePreviewRequest({ ...body, user: 'x'.repeat(8001) })).toBeNull();
  });
});
