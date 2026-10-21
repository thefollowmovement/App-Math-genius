import { nextVersion, previewView } from './preview';

describe('a prompt test', () => {
  it('shows what the child would see, and what it cost', () => {
    expect(
      previewView({
        ok: true,
        exercise: '12 + 9 = ?',
        given: '11',
        solution: '21',
        generated: {
          ok: true,
          raw: '{"what": "…"}',
          rendered: { what: 'Tu as écrit 11.', image: 'Imagine.', tip: 'Astuce.' },
          usage: { tokensIn: 500, tokensOut: 80, latencyMs: 812.4 },
        },
      }),
    ).toEqual({
      kind: 'done',
      exercise: '12 + 9 = ?',
      given: '11',
      solution: '21',
      raw: '{"what": "…"}',
      shown: { what: 'Tu as écrit 11.', image: 'Imagine.', tip: 'Astuce.' },
      problems: [],
      tokens: 580,
      latencyMs: 812,
    });
  });

  it('says what the checks refused, or why nothing was asked', () => {
    const refused = previewView({
      ok: true,
      generated: { ok: false, raw: 'x', problems: ['digits'], usage: null },
    });
    expect(refused).toMatchObject({ kind: 'done', shown: null, problems: ['digits'] });
    expect(previewView({ ok: false, reason: 'budget' })).toEqual({
      kind: 'refused-request',
      reason: 'budget',
    });
  });

  it('numbers the next version', () => {
    expect(nextVersion([{ version: 1 }, { version: 3 }])).toBe(4);
    expect(nextVersion([])).toBe(1);
  });
});
