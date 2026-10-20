import { DEFAULT_PROMPT } from './prompt';
import {
  providerOf,
  readChildContext,
  readNightPlan,
  readSettings,
  readTemplate,
  readUniverse,
  usageRow,
} from './context';
import { MISTRAL_URL } from './providers';

const SECRETS = { mistralKey: 'mistral-key', ownKey: 'own-key' };
const MISTRAL_ROW = {
  kind: 'mistral',
  base_url: 'https://api.mistral.ai',
  model: 'ministral-8b-latest',
  price_input: 0.15,
  price_output: '0.15',
};
const OWN_ROW = {
  kind: 'openai-compatible',
  base_url: 'http://192.168.1.20:11434',
  model: 'ministral-8b',
  price_input: 0,
  price_output: 0,
};
const SETTINGS_ROW = {
  enabled: true,
  realtime_provider: MISTRAL_ROW,
  night_provider: OWN_ROW,
  moderation: true,
  daily_cap_usd: 2,
  monthly_cap_usd: '30.00',
  night_batch: 50,
};

describe('what the database gives the gateway', () => {
  it('reads the providers set in the back-office, with the keys of the function’s secrets', () => {
    expect(providerOf(MISTRAL_ROW, SECRETS)).toEqual({
      kind: 'mistral',
      baseUrl: 'https://api.mistral.ai',
      model: 'ministral-8b-latest',
      apiKey: 'mistral-key',
      price: { input: 0.15, output: 0.15 },
    });
    expect(providerOf(OWN_ROW, SECRETS)?.apiKey).toBe('own-key');
    expect(providerOf(OWN_ROW, {})?.apiKey).toBeUndefined();
    // Without the Mistral key, or with a server that is not a web address: no provider.
    expect(providerOf(MISTRAL_ROW, {})).toBeNull();
    expect(providerOf({ ...OWN_ROW, base_url: 'file:///etc' }, SECRETS)).toBeNull();
    expect(providerOf({ ...OWN_ROW, model: ' ' }, SECRETS)).toBeNull();
    expect(providerOf(null, SECRETS)).toBeNull();
  });

  it('reads the settings, the budget spent and the prompt; Mistral moderates with its key', () => {
    const settings = readSettings(
      {
        settings: SETTINGS_ROW,
        spent: { today: 0.5, month: '3.2' },
        banned: ['nul', 4],
        prompt: { version: 2, system: 'Système', user: 'Utilisateur' },
      },
      SECRETS,
    );
    expect(settings).toMatchObject({
      enabled: true,
      realtime: { kind: 'mistral' },
      night: { kind: 'openai-compatible' },
      moderation: { baseUrl: MISTRAL_URL, model: 'mistral-moderation-latest' },
      dailyCapUsd: 2,
      monthlyCapUsd: 30,
      spentTodayUsd: 0.5,
      spentMonthUsd: 3.2,
      banned: ['nul'],
      prompt: { version: 2, system: 'Système', user: 'Utilisateur' },
    });
    expect(readSettings({ settings: SETTINGS_ROW }, {}).moderation).toBeNull();
  });

  it('turns the AI off when the settings are missing, and keeps the first prompt', () => {
    const settings = readSettings(null, SECRETS);
    expect(settings.enabled).toBe(false);
    expect(settings.realtime).toBeNull();
    expect(settings.prompt).toBe(DEFAULT_PROMPT);
  });

  it('reads a child’s grade and universes', () => {
    const context = readChildContext(
      {
        grade: 'CM1',
        universes: [
          { id: 'minecraft', name: 'Minecraft', vocabulary: { words: ['blocs', 1] } },
          { id: 'foot', name: 'Foot', vocabulary: null },
        ],
        settings: SETTINGS_ROW,
      },
      SECRETS,
    );
    expect(context?.grade).toBe('CM1');
    expect(context?.universes).toEqual([
      { id: 'minecraft', name: 'Minecraft', vocabulary: { words: ['blocs'], images: [] } },
      { id: 'foot', name: 'Foot', vocabulary: {} },
    ]);
    expect(readChildContext(null, SECRETS)).toBeNull();
    expect(readUniverse({ id: 'foot', name: 'Foot' })).toEqual({
      id: 'foot',
      name: 'Foot',
      vocabulary: {},
    });
    expect(readUniverse(null)).toBeNull();
    expect(readChildContext({ grade: 'CM3' }, SECRETS)).toBeNull();
  });

  it('reads the night’s plan', () => {
    const plan = readNightPlan(
      {
        settings: SETTINGS_ROW,
        occurrences: [{ band: 'cm1-cm2', skill: 'cm1.perimetre', error: null, count: 3 }],
        universes: [
          { band: 'cm1-cm2', count: 2, universe: { id: 'minecraft', name: 'Minecraft' } },
          { band: 'cm1-cm2', count: 2, universe: null },
        ],
        existing: ['cm1.perimetre|||cm1-cm2'],
        remaining: 12,
      },
      SECRETS,
    );
    expect(plan.occurrences).toEqual([
      { band: 'cm1-cm2', skill: 'cm1.perimetre', error: null, count: 3 },
    ]);
    expect(plan.universes.map((item) => item.universe.id)).toEqual(['minecraft']);
    expect(plan.existing.has('cm1.perimetre|||cm1-cm2')).toBe(true);
    expect(plan.remaining).toBe(12);
    expect(readNightPlan(null, SECRETS).remaining).toBe(0);
  });

  it('reads a stored explanation, and refuses a damaged one', () => {
    expect(readTemplate({ what: 'a', image: 'b', tip: 'c' })).toEqual({
      what: 'a',
      image: 'b',
      tip: 'c',
    });
    expect(readTemplate({ what: 'a', image: 'b' })).toBeNull();
  });

  it('logs a call with its key and the child, as coach_log_usage stores it', () => {
    expect(
      usageRow(
        {
          task: 'realtime',
          provider: 'mistral',
          model: 'ministral-8b-latest',
          tokensIn: 600,
          tokensOut: 200,
          costUsd: 0.00012,
          latencyMs: 812.4,
          outcome: 'ok',
          problems: [],
          key: { skill: 'cm1.perimetre', error: 'area-perimeter', universe: null, band: 'cm1-cm2' },
          promptVersion: 1,
        },
        'child-id',
      ),
    ).toEqual({
      task: 'realtime',
      provider: 'mistral',
      model: 'ministral-8b-latest',
      tokens_in: 600,
      tokens_out: 200,
      cost_usd: 0.00012,
      latency_ms: 812,
      outcome: 'ok',
      problems: [],
      child_id: 'child-id',
      skill_code: 'cm1.perimetre',
      error_type: 'area-perimeter',
      universe_id: null,
      grade_band: 'cm1-cm2',
      prompt_version: 1,
    });
  });
});
