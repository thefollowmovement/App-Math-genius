import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  DEFAULT_ADVICE_PROMPT,
  type AdviceSettings,
  adviceProblems,
  advise,
  buildAdvicePrompt,
  parseAdvice,
  readAdviceContext,
} from './advice';
import type { Usage } from './gateway';
import type { Fetch, Provider } from './providers';

const MIGRATIONS = join(__dirname, '../../../supabase/migrations');

const MISTRAL: Provider = {
  kind: 'mistral',
  baseUrl: 'https://api.mistral.ai',
  model: 'ministral-8b-latest',
  apiKey: 'test-key',
  price: { input: 0.15, output: 0.15 },
};

const TIPS = [
  'Proposez une séance courte chaque mercredi, au même moment, pour garder le rythme.',
  'Rangez ensemble des prix du supermarché pour revoir la comparaison des nombres décimaux.',
  'Félicitez votre enfant pour sa régularité et laissez-le expliquer sa méthode à voix haute.',
];

const SETTINGS: AdviceSettings = {
  enabled: true,
  realtime: MISTRAL,
  night: null,
  moderation: null,
  dailyCapUsd: 2,
  monthlyCapUsd: 30,
  spentTodayUsd: 0,
  spentMonthUsd: 0,
  banned: ['nul'],
  prompt: DEFAULT_ADVICE_PROMPT,
};

const INPUT = {
  grade: 'CM1' as const,
  facts: ['13 jours faits sur 17 prévus', 'compare les décimaux comme des entiers (17 erreurs)'],
  summary: 'Points forts : calcul. À travailler : nombres décimaux.',
};

function fakeModel(answers: (string | number)[]) {
  const bodies: Record<string, unknown>[] = [];
  const fetcher: Fetch = async (url, init) => {
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    bodies.push(body);
    if (url.endsWith('/moderations')) {
      return Response.json({ results: [{ categories: { violence: false } }] });
    }
    const answer = answers.shift() ?? JSON.stringify({ tips: TIPS });
    if (typeof answer === 'number') return new Response('error', { status: answer });
    return Response.json({
      choices: [{ message: { content: answer } }],
      usage: { prompt_tokens: 500, completion_tokens: 120 },
    });
  };
  return { fetcher, bodies };
}

const logStore = () => {
  const usages: Usage[] = [];
  return { usages, logUsage: async (usage: Usage) => void usages.push(usage) };
};

describe('the coach’s tips to the parent', () => {
  it('has the prompt the migration loads (ai_prompts, task « advice », version 1)', () => {
    const name = readdirSync(MIGRATIONS).find((file) => file.endsWith('_recaps.sql'));
    const sql = readFileSync(join(MIGRATIONS, name ?? ''), 'utf8');
    expect(sql).toContain(`$prompt$${DEFAULT_ADVICE_PROMPT.system}$prompt$`);
    expect(sql).toContain(`$prompt$${DEFAULT_ADVICE_PROMPT.user}$prompt$`);
  });

  it('gives the model the month’s facts and the profile, never a name', () => {
    const { user } = buildAdvicePrompt(DEFAULT_ADVICE_PROMPT, INPUT);
    expect(user).toContain('Classe : CM1.');
    expect(user).toContain('- 13 jours faits sur 17 prévus');
    expect(user).toContain('À travailler : nombres décimaux');
    expect(buildAdvicePrompt(DEFAULT_ADVICE_PROMPT, { ...INPUT, summary: null }).user).toContain(
      '(pas de profil)',
    );
  });

  it('keeps three tips of a sentence each, without digits nor banned words', () => {
    expect(parseAdvice('```json\n{"tips": ["a  b", "c"]}\n```')).toEqual(['a b', 'c']);
    expect(parseAdvice('not json')).toBeNull();
    expect(adviceProblems(TIPS, [])).toEqual([]);
    expect(adviceProblems(TIPS.slice(0, 2), [])).toEqual(['count']);
    expect(adviceProblems([...TIPS.slice(0, 2), 'Trop court.'], [])).toEqual(['length']);
    expect(
      adviceProblems([...TIPS.slice(0, 2), 'Faites 10 minutes de tables chaque soir.'], []),
    ).toEqual(['digits']);
    expect(
      adviceProblems(
        [...TIPS.slice(0, 2), 'Ne dites jamais que c’est nul, encouragez-le.'],
        ['nul'],
      ),
    ).toEqual(['banned-word']);
    expect(adviceProblems(null, [])).toEqual(['unreadable']);
  });

  it('asks the model and logs the call as « advice »', async () => {
    const { fetcher, bodies } = fakeModel([]);
    const store = logStore();
    expect(await advise(INPUT, SETTINGS, store, fetcher)).toEqual({ ok: true, tips: TIPS });
    expect(store.usages).toMatchObject([
      { task: 'advice', outcome: 'ok', key: null, promptVersion: 1 },
    ]);
    expect(JSON.stringify(bodies[0])).not.toContain('Léa');
  });

  it('falls back on the standard tips when the answer fails the checks', async () => {
    const store = logStore();
    const { fetcher } = fakeModel([
      JSON.stringify({ tips: ['Faites 3 exercices par jour, chaque jour de la semaine.'] }),
    ]);
    expect(await advise(INPUT, SETTINGS, store, fetcher)).toEqual({
      ok: false,
      reason: 'rejected',
    });
    expect(store.usages[0]).toMatchObject({ outcome: 'rejected', problems: ['count', 'digits'] });
    expect(await advise(INPUT, SETTINGS, store, fakeModel([500]).fetcher)).toEqual({
      ok: false,
      reason: 'failed',
    });
    expect(store.usages[1]).toMatchObject({ outcome: 'error' });
  });

  it('runs the moderation model on the tips', async () => {
    const flagged: Fetch = async (url) =>
      url.endsWith('/moderations')
        ? Response.json({ results: [{ categories: { violence: true } }] })
        : Response.json({ choices: [{ message: { content: JSON.stringify({ tips: TIPS }) } }] });
    const store = logStore();
    const result = await advise(INPUT, { ...SETTINGS, moderation: MISTRAL }, store, flagged);
    expect(result).toEqual({ ok: false, reason: 'rejected' });
    expect(store.usages[0]?.problems).toEqual(['moderation']);
  });

  it('respects the switch and the budget, and calls nothing without a model', async () => {
    const { fetcher, bodies } = fakeModel([]);
    const store = logStore();
    expect(await advise(INPUT, { ...SETTINGS, enabled: false }, store, fetcher)).toEqual({
      ok: false,
      reason: 'off',
    });
    expect(await advise(INPUT, { ...SETTINGS, spentMonthUsd: 30 }, store, fetcher)).toEqual({
      ok: false,
      reason: 'budget',
    });
    expect(await advise(INPUT, { ...SETTINGS, realtime: null }, store, fetcher)).toEqual({
      ok: false,
      reason: 'no-provider',
    });
    expect(bodies).toHaveLength(0);
    // Our own server is free: no budget to keep.
    const own: Provider = { ...MISTRAL, kind: 'openai-compatible', price: { input: 0, output: 0 } };
    const result = await advise(
      INPUT,
      { ...SETTINGS, realtime: null, night: own, spentMonthUsd: 30 },
      store,
      fetcher,
    );
    expect(result.ok).toBe(true);
  });

  it('reads its context from the database, the prompt included', () => {
    const context = readAdviceContext(
      {
        grade: 'CM1',
        band: 'cm1-cm2',
        settings: {
          enabled: true,
          realtime_provider: { kind: 'mistral', model: 'ministral-8b-latest', price_input: 0.15 },
          moderation: true,
          daily_cap_usd: 2,
          monthly_cap_usd: 30,
        },
        prompt: { version: 3, system: 'Système', user: 'Bilan : {{bilan}}' },
        banned: ['nul'],
        spent: { today: 0.5, month: 4 },
      },
      { mistralKey: 'key' },
    );
    expect(context?.grade).toBe('CM1');
    expect(context?.settings.prompt).toEqual({
      version: 3,
      system: 'Système',
      user: 'Bilan : {{bilan}}',
    });
    expect(context?.settings.realtime?.model).toBe('ministral-8b-latest');
    expect(context?.settings.spentMonthUsd).toBe(4);
    expect(readAdviceContext({ grade: 'CM1' }, {})?.settings.prompt).toBe(DEFAULT_ADVICE_PROMPT);
    expect(readAdviceContext({ grade: 'Terminale' }, {})).toBeNull();
  });
});
