import type { Database, Json } from '@math-genius/shared';

type Tables = Database['public']['Tables'];
export type AiSettingsRow = Tables['ai_settings']['Row'];
export type AiSettingsUpdate = Tables['ai_settings']['Update'];

export const PROVIDER_KINDS = ['mistral', 'openai-compatible'] as const;
export type ProviderKind = (typeof PROVIDER_KINDS)[number];
export const MISTRAL_URL = 'https://api.mistral.ai';

/** A provider as typed in the form: { kind, base_url, model, price_input, price_output } stored. */
export type ProviderDraft = {
  kind: ProviderKind;
  baseUrl: string;
  model: string;
  priceIn: string;
  priceOut: string;
};

export type SettingsDraft = {
  realtime: ProviderDraft;
  /** Null: the night uses the real-time model. */
  night: ProviderDraft | null;
  moderation: boolean;
  dailyCap: string;
  monthlyCap: string;
  nightBatch: string;
};

export type SettingsProblem =
  | 'realtime.url'
  | 'realtime.model'
  | 'realtime.price'
  | 'night.url'
  | 'night.model'
  | 'night.price'
  | 'dailyCap'
  | 'monthlyCap'
  | 'nightBatch';

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown) => (typeof value === 'string' ? value : '');
const numberText = (value: unknown) =>
  typeof value === 'number' ? String(value) : typeof value === 'string' ? value : '0';

export const emptyProvider = (kind: ProviderKind): ProviderDraft => ({
  kind,
  baseUrl: kind === 'mistral' ? MISTRAL_URL : 'http://',
  model: '',
  priceIn: '0',
  priceOut: '0',
});

export function providerDraft(value: Json | null): ProviderDraft | null {
  if (!isRow(value)) return null;
  const kind = PROVIDER_KINDS.find((item) => item === value.kind) ?? 'mistral';
  return {
    kind,
    baseUrl: text(value.base_url) || (kind === 'mistral' ? MISTRAL_URL : ''),
    model: text(value.model),
    priceIn: numberText(value.price_input),
    priceOut: numberText(value.price_output),
  };
}

export const settingsDraft = (row: AiSettingsRow): SettingsDraft => ({
  realtime: providerDraft(row.realtime_provider) ?? emptyProvider('mistral'),
  night: providerDraft(row.night_provider),
  moderation: row.moderation,
  dailyCap: String(row.daily_cap_usd),
  monthlyCap: String(row.monthly_cap_usd),
  nightBatch: String(row.night_batch),
});

const amount = (value: string) => {
  const parsed = Number(value.replace(',', '.'));
  return value.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

function providerProblems(draft: ProviderDraft, prefix: 'realtime' | 'night'): SettingsProblem[] {
  const problems: SettingsProblem[] = [];
  if (!/^https?:\/\/[^\s/]+/.test(draft.baseUrl.trim())) problems.push(`${prefix}.url`);
  if (draft.model.trim() === '') problems.push(`${prefix}.model`);
  if (amount(draft.priceIn) === null || amount(draft.priceOut) === null) {
    problems.push(`${prefix}.price`);
  }
  return problems;
}

export function settingsProblems(draft: SettingsDraft): SettingsProblem[] {
  const problems = providerProblems(draft.realtime, 'realtime');
  if (draft.night) problems.push(...providerProblems(draft.night, 'night'));
  if (amount(draft.dailyCap) === null) problems.push('dailyCap');
  if (amount(draft.monthlyCap) === null) problems.push('monthlyCap');
  const batch = Number(draft.nightBatch);
  if (!Number.isInteger(batch) || batch < 0 || batch > 1000) problems.push('nightBatch');
  return problems;
}

const providerRecord = (draft: ProviderDraft) => ({
  kind: draft.kind,
  base_url: draft.baseUrl.trim().replace(/\/+$/, ''),
  model: draft.model.trim(),
  price_input: amount(draft.priceIn) ?? 0,
  price_output: amount(draft.priceOut) ?? 0,
});

/** The row to write; the emergency switch is written on its own. */
export const settingsUpdate = (draft: SettingsDraft): AiSettingsUpdate => ({
  realtime_provider: providerRecord(draft.realtime),
  night_provider: draft.night ? providerRecord(draft.night) : null,
  moderation: draft.moderation,
  daily_cap_usd: amount(draft.dailyCap) ?? 0,
  monthly_cap_usd: amount(draft.monthlyCap) ?? 0,
  night_batch: Number(draft.nightBatch),
});

export type CostDay = {
  day: string;
  calls: number;
  costUsd: number;
  ok: number;
  rejected: number;
  errors: number;
  latencyMs: number;
};
export type Costs = {
  days: CostDay[];
  children: { child: string; calls: number; costUsd: number }[];
  spent: { today: number; month: number };
};

const num = (value: unknown) => {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
};

/** admin_ai_costs' answer; null when the role may not read it. */
export function costsOf(value: Json | null): Costs | null {
  if (!isRow(value)) return null;
  const record: Row = value;
  const rows = (key: string): Row[] => {
    const list: unknown = record[key];
    return Array.isArray(list) ? (list as unknown[]).filter(isRow) : [];
  };
  const spent: Row = isRow(record.spent) ? record.spent : {};
  return {
    days: rows('days').map((day) => ({
      day: text(day.day),
      calls: num(day.calls),
      costUsd: num(day.cost_usd),
      ok: num(day.ok),
      rejected: num(day.rejected),
      errors: num(day.errors),
      latencyMs: num(day.latency_ms),
    })),
    children: rows('children').map((child) => ({
      child: text(child.child),
      calls: num(child.calls),
      costUsd: num(child.cost_usd),
    })),
    spent: { today: num(spent.today), month: num(spent.month) },
  };
}

/** Dollars, as the budget shows them. */
export const dollars = (value: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(
    value,
  );

/** The share of a cap already spent, 0 to 1. */
export const budgetShare = (spent: number, cap: number) =>
  cap <= 0 ? 1 : Math.min(1, Math.max(0, spent / cap));
