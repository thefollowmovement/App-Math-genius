import {
  budgetShare,
  costsOf,
  emptyProvider,
  settingsDraft,
  settingsProblems,
  settingsUpdate,
  type AiSettingsRow,
} from './ai-settings';

const ROW: AiSettingsRow = {
  id: 1,
  enabled: true,
  realtime_provider: {
    kind: 'mistral',
    base_url: 'https://api.mistral.ai',
    model: 'ministral-8b-latest',
    price_input: 0.15,
    price_output: 0.15,
  },
  night_provider: null,
  moderation: true,
  daily_cap_usd: 2,
  monthly_cap_usd: 30,
  night_batch: 50,
  created_at: '2026-10-20T00:00:00Z',
  updated_at: '2026-10-20T00:00:00Z',
};

describe('the AI settings form', () => {
  it('reads the settings as stored, and writes them back', () => {
    const draft = settingsDraft(ROW);
    expect(draft.realtime).toEqual({
      kind: 'mistral',
      baseUrl: 'https://api.mistral.ai',
      model: 'ministral-8b-latest',
      priceIn: '0.15',
      priceOut: '0.15',
    });
    expect(draft.night).toBeNull();
    expect(settingsProblems(draft)).toEqual([]);
    expect(settingsUpdate(draft)).toEqual({
      realtime_provider: ROW.realtime_provider,
      night_provider: null,
      moderation: true,
      daily_cap_usd: 2,
      monthly_cap_usd: 30,
      night_batch: 50,
    });
  });

  it('adds our own server for the night, with a comma for decimals', () => {
    const night = {
      ...emptyProvider('openai-compatible'),
      baseUrl: 'http://192.168.1.20:11434/',
      model: 'ministral-8b',
    };
    const update = settingsUpdate({ ...settingsDraft(ROW), night, dailyCap: '1,5' });
    expect(update.night_provider).toEqual({
      kind: 'openai-compatible',
      base_url: 'http://192.168.1.20:11434',
      model: 'ministral-8b',
      price_input: 0,
      price_output: 0,
    });
    expect(update.daily_cap_usd).toBe(1.5);
  });

  it('says what is wrong before saving', () => {
    const draft = settingsDraft(ROW);
    expect(
      settingsProblems({
        ...draft,
        night: { ...emptyProvider('openai-compatible'), baseUrl: 'ftp://x' },
        realtime: { ...draft.realtime, priceIn: '-1' },
        monthlyCap: '',
        nightBatch: '2000',
      }),
    ).toEqual(['realtime.price', 'night.url', 'night.model', 'monthlyCap', 'nightBatch']);
  });
});

describe('the costs', () => {
  it('reads admin_ai_costs', () => {
    const costs = costsOf({
      days: [
        {
          day: '2026-10-20',
          calls: 3,
          cost_usd: '0.0004',
          ok: 2,
          rejected: 1,
          errors: 0,
          latency_ms: 900,
        },
      ],
      children: [{ child: 'abc', calls: 3, cost_usd: 0.0004 }],
      spent: { today: 0.0004, month: 0.01 },
    });
    expect(costs?.days[0]).toMatchObject({ calls: 3, costUsd: 0.0004, rejected: 1 });
    expect(costs?.spent).toEqual({ today: 0.0004, month: 0.01 });
    expect(costsOf(null)).toBeNull();
  });

  it('shows how much of a cap is spent', () => {
    expect(budgetShare(1, 2)).toBe(0.5);
    expect(budgetShare(3, 2)).toBe(1);
    expect(budgetShare(0, 0)).toBe(1);
  });
});
