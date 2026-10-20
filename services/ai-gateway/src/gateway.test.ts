import { coachFrame, coachSample, type Explanation } from '@math-genius/exercise-engine';

import { bannedWordsIn, parseExplanation } from './checks';
import {
  type CacheKey,
  type GatewaySettings,
  type GatewayStore,
  type Usage,
  explain,
  pickUniverse,
  pregenerate,
} from './gateway';
import { keyString, nightJobs } from './night';
import { DEFAULT_PROMPT, EVERYDAY, buildPrompt, type Universe } from './prompt';
import { type Fetch, type Provider, chat, moderate } from './providers';

const MISTRAL: Provider = {
  kind: 'mistral',
  baseUrl: 'https://api.mistral.ai',
  model: 'ministral-8b-latest',
  apiKey: 'test-key',
  price: { input: 0.15, output: 0.15 },
};
const OWN: Provider = {
  kind: 'openai-compatible',
  baseUrl: 'http://192.168.1.20:11434/v1',
  model: 'ministral-8b',
  price: { input: 0, output: 0 },
};
const MINECRAFT: Universe = {
  id: 'minecraft',
  name: 'Minecraft',
  vocabulary: { words: ['blocs', 'pioche'], images: ['une tour de blocs'] },
};
const FOOT: Universe = { id: 'football', name: 'Foot', vocabulary: { words: ['but'] } };

const GOOD: Explanation = {
  what: 'Tu as écrit {reponse} : la retenue s’est envolée !',
  image: 'Dans Minecraft, une rangée pleine de blocs passe à la colonne d’à côté.',
  tip: 'Garde la retenue : {n1} + {n2} = {solution}.',
};

/** A model server that answers each call with the next of `answers` (a string: a reply). */
function fakeServer(answers: (Explanation | string | number)[]) {
  const calls: { url: string; body: Record<string, unknown>; auth: string | null }[] = [];
  const fetcher: Fetch = async (url, init) => {
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    const headers = new Headers(init.headers);
    calls.push({ url, body, auth: headers.get('Authorization') });
    if (url.endsWith('/moderations')) {
      return Response.json({ results: [{ categories: { violence: false, sexual: false } }] });
    }
    const answer = answers.shift();
    if (typeof answer === 'number') return new Response('error', { status: answer });
    const content = typeof answer === 'string' ? answer : JSON.stringify(answer ?? GOOD);
    return Response.json({
      choices: [{ message: { content } }],
      usage: { prompt_tokens: 600, completion_tokens: 200 },
    });
  };
  return { fetcher, calls };
}

function memoryStore(seed: { key: CacheKey; template: Explanation }[] = []) {
  const rows = seed.map((row, index) => ({ id: `cached-${index}`, ...row }));
  const usage: Usage[] = [];
  const store: GatewayStore = {
    cached: async (key, exclude) =>
      rows.filter((row) => keyString(row.key) === keyString(key) && !exclude.includes(row.id)),
    save: async (entry) => {
      const id = `new-${rows.length}`;
      rows.push({ id, key: entry.key, template: entry.template });
      return id;
    },
    logUsage: async (entry) => {
      usage.push(entry);
    },
  };
  return { store, rows, usage };
}

const settings = (fields: Partial<GatewaySettings> = {}): GatewaySettings => ({
  enabled: true,
  realtime: MISTRAL,
  night: null,
  moderation: null,
  dailyCapUsd: 5,
  monthlyCapUsd: 50,
  spentTodayUsd: 0,
  spentMonthUsd: 0,
  banned: [],
  prompt: DEFAULT_PROMPT,
  ...fields,
});

const sample = () => {
  const found = coachSample('ce2.addition-posee', 'forgot-carry');
  if (!found) throw new Error('no sample');
  return found;
};
const input = (universes: Universe[] = [MINECRAFT], exclude: string[] = []) => ({
  ...sample(),
  grade: 'CE2' as const,
  universes,
  exclude,
});
const KEY: CacheKey = {
  skill: 'ce2.addition-posee',
  error: 'forgot-carry',
  universe: 'minecraft',
  band: 'cp-ce2',
};

describe('providers', () => {
  it('call the chat API of Mistral or of our own server, asking for JSON', async () => {
    const { fetcher, calls } = fakeServer([GOOD, GOOD]);
    const request = { system: 's', user: 'u', maxTokens: 300, temperature: 0.5, timeoutMs: 1000 };
    const result = await chat(MISTRAL, request, fetcher);
    await chat(OWN, request, fetcher);
    expect(calls.map((call) => call.url)).toEqual([
      'https://api.mistral.ai/v1/chat/completions',
      'http://192.168.1.20:11434/v1/chat/completions',
    ]);
    expect(calls[0]?.auth).toBe('Bearer test-key');
    expect(calls[1]?.auth).toBeNull();
    expect(calls[0]?.body).toMatchObject({ model: 'ministral-8b-latest', max_tokens: 300 });
    expect(result).toMatchObject({ tokensIn: 600, tokensOut: 200 });
    expect(parseExplanation(result.text)).toEqual(GOOD);
  });

  it('read the moderation model’s verdict', async () => {
    const fetcher: Fetch = async () =>
      Response.json({ results: [{ categories: { violence: true, hate: false } }] });
    expect(await moderate(MISTRAL, 'texte', fetcher)).toEqual(['violence']);
  });
});

describe('reading and checking the model’s answer', () => {
  it('finds the three parts, even in a code block', () => {
    expect(parseExplanation('```json\n' + JSON.stringify(GOOD) + '\n```')).toEqual(GOOD);
    expect(parseExplanation('{"what": "a", "image": "b"}')).toBeNull();
    expect(parseExplanation('pas de JSON')).toBeNull();
  });

  it('finds banned words, accents and case aside', () => {
    const banned = ['nul', 'idiot', 'pas doué'];
    expect(bannedWordsIn('Tu es IDIOT et pas doué', banned)).toEqual(['idiot', 'pas doué']);
    expect(bannedWordsIn('Une nullité ? Non, une annulation.', banned)).toEqual([]);
  });
});

describe('the prompt', () => {
  it('gives the exercise with its slots, the mistake, the tone and one universe, nothing else', () => {
    const { exercise, response } = sample();
    const frame = coachFrame(exercise, response);
    const prompt = buildPrompt(DEFAULT_PROMPT, {
      frame,
      grade: 'CE2',
      band: 'cp-ce2',
      skillTitle: 'Poser une addition',
      errorLabel: 'oublie la retenue',
      universe: MINECRAFT,
    });
    expect(prompt.user).toContain('Exercice : {n1} + {n2} = ?');
    expect(prompt.user).toContain('Erreur repérée : oublie la retenue.');
    expect(prompt.user).toContain('Minecraft — mots : blocs, pioche — images : une tour de blocs');
    expect(prompt.user).toContain(`{n1} = ${frame.slots.n1}`);
    expect(prompt.user).not.toMatch(/\{\{\w+\}\}/);
    const everyday = buildPrompt(DEFAULT_PROMPT, {
      frame,
      grade: 'CE2',
      band: 'cp-ce2',
      skillTitle: 'Poser une addition',
      errorLabel: null,
      universe: null,
    });
    expect(everyday.user).toContain(EVERYDAY);
  });
});

describe('an explanation after a mistake', () => {
  it('comes from the cache when one fits, without calling the model', async () => {
    const { store } = memoryStore([{ key: KEY, template: GOOD }]);
    const { fetcher, calls } = fakeServer([]);
    const result = await explain(input(), settings(), store, fetcher);
    expect(result).toMatchObject({ source: 'cache', id: 'cached-0', universe: 'minecraft' });
    expect(calls).toHaveLength(0);
  });

  it('is written by the model, checked, kept and shown with the exercise’s numbers', async () => {
    const { store, rows, usage } = memoryStore();
    const { fetcher } = fakeServer([GOOD]);
    const { exercise } = sample();
    const result = await explain(input(), settings(), store, fetcher);
    expect(result.source).toBe('ai');
    if (result.source !== 'ai') return;
    expect(result.explanation.tip).toContain(`= ${exercise.explanation.at(-1)?.split(' = ')[1]}`);
    expect(rows).toHaveLength(1);
    expect(usage[0]).toMatchObject({ task: 'realtime', outcome: 'ok', costUsd: 0.00012 });
  });

  it('falls back on the generator’s correction when the model writes its own numbers', async () => {
    const { store, rows, usage } = memoryStore();
    const lying = { ...GOOD, tip: 'Garde la retenue : 687 + 39 = 716.' };
    const { fetcher } = fakeServer([lying]);
    expect(await explain(input(), settings(), store, fetcher)).toEqual({
      source: 'standard',
      reason: 'rejected',
    });
    expect(rows).toHaveLength(0);
    expect(usage[0]).toMatchObject({
      outcome: 'rejected',
      problems: expect.arrayContaining(['digits']),
    });
  });

  it('falls back on it when the model is down, the AI is off or the budget is spent', async () => {
    const { store } = memoryStore();
    expect(await explain(input(), settings(), store, fakeServer([503]).fetcher)).toEqual({
      source: 'standard',
      reason: 'failed',
    });
    expect(
      await explain(input(), settings({ enabled: false }), store, fakeServer([]).fetcher),
    ).toEqual({
      source: 'standard',
      reason: 'off',
    });
    expect(
      await explain(input(), settings({ spentTodayUsd: 5 }), store, fakeServer([]).fetcher),
    ).toEqual({ source: 'standard', reason: 'budget' });
    expect(
      await explain(input(), settings({ realtime: null }), store, fakeServer([]).fetcher),
    ).toEqual({
      source: 'standard',
      reason: 'no-provider',
    });
  });

  it('is refused by the banned words and by the moderation model', async () => {
    const { store } = memoryStore();
    const banned = await explain(
      input(),
      settings({ banned: ['envolée'] }),
      store,
      fakeServer([GOOD]).fetcher,
    );
    expect(banned).toEqual({ source: 'standard', reason: 'rejected' });
    const flagging: Fetch = async (url, init) =>
      url.endsWith('/moderations')
        ? Response.json({ results: [{ categories: { violence: true } }] })
        : fakeServer([GOOD]).fetcher(url, init);
    expect(await explain(input(), settings({ moderation: MISTRAL }), store, flagging)).toEqual({
      source: 'standard',
      reason: 'rejected',
    });
  });

  it('takes another universe and another explanation at « Explique autrement »', async () => {
    const universes = [MINECRAFT, FOOT];
    const { exercise } = sample();
    const first = pickUniverse(universes, exercise.seed, 0);
    expect(pickUniverse(universes, exercise.seed, 1)).not.toEqual(first);
    expect(pickUniverse([], exercise.seed, 3)).toBeNull();
    const { store } = memoryStore([
      { key: KEY, template: GOOD },
      { key: { ...KEY, universe: 'football' }, template: GOOD },
    ]);
    const shown = await explain(input(universes), settings(), store, fakeServer([]).fetcher);
    if (shown.source === 'standard') throw new Error('nothing shown');
    const again = await explain(
      input(universes, [shown.id]),
      settings(),
      store,
      fakeServer([]).fetcher,
    );
    expect(again.source).toBe('cache');
    expect(again.source !== 'standard' && again.id).not.toBe(shown.id);
  });

  it('is not asked for a right answer', async () => {
    const { exercise } = sample();
    const right = {
      type: 'numeric' as const,
      text: exercise.explanation.at(-1)?.split(' = ')[1] ?? '',
    };
    expect(
      await explain(
        { ...input(), response: right },
        settings(),
        memoryStore().store,
        fakeServer([]).fetcher,
      ),
    ).toEqual({ source: 'standard', reason: 'correct' });
  });
});

describe('the night', () => {
  it('writes the most frequent mistakes first, everyday examples before universes', () => {
    const jobs = nightJobs({
      occurrences: [
        { band: 'cp-ce2', skill: 'ce2.addition-posee', error: 'forgot-carry', count: 12 },
        { band: 'cm1-cm2', skill: 'cm1.perimetre', error: 'area-perimeter', count: 3 },
        { band: 'cp-ce2', skill: 'not-a-skill', error: null, count: 99 },
      ],
      universes: [
        { band: 'cp-ce2', universe: MINECRAFT, count: 5 },
        { band: 'cp-ce2', universe: FOOT, count: 9 },
      ],
      existing: new Set([keyString({ ...KEY, universe: 'football' })]),
      limit: 3,
    });
    expect(jobs.map((job) => keyString(job.key))).toEqual([
      'ce2.addition-posee|forgot-carry||cp-ce2',
      'ce2.addition-posee|forgot-carry|minecraft|cp-ce2',
      'cm1.perimetre|area-perimeter||cm1-cm2',
    ]);
    expect(jobs[0]?.grade).toBe('CE2');
  });

  it('runs on our own server, keeps what passes and counts the rest', async () => {
    const { store, rows, usage } = memoryStore();
    const { fetcher, calls } = fakeServer([GOOD, { ...GOOD, image: 'Il y a trois blocs.' }, 500]);
    const job = { key: KEY, universe: MINECRAFT, grade: 'CE2' as const };
    const counts = await pregenerate([job, job, job], settings({ night: OWN }), store, fetcher);
    expect(counts).toEqual({ kept: 1, rejected: 1, failed: 1, skipped: 0 });
    expect(rows).toHaveLength(1);
    expect(calls.every((call) => call.url.startsWith('http://192.168.1.20'))).toBe(true);
    expect(usage.map((entry) => entry.task)).toEqual(['night', 'night', 'night']);
  });

  it('stops at the budget and does nothing with the AI off', async () => {
    const job = { key: KEY, universe: null, grade: 'CE2' as const };
    expect(
      await pregenerate(
        [job],
        settings({ spentMonthUsd: 50 }),
        memoryStore().store,
        fakeServer([]).fetcher,
      ),
    ).toEqual({ kept: 0, rejected: 0, failed: 0, skipped: 1 });
    expect(
      await pregenerate(
        [job, job],
        settings({ enabled: false }),
        memoryStore().store,
        fakeServer([]).fetcher,
      ),
    ).toEqual({ kept: 0, rejected: 0, failed: 0, skipped: 2 });
  });
});
