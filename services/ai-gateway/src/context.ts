import type { Explanation } from '@math-genius/exercise-engine';
import { GRADES, type Grade } from '@math-genius/shared';

import type { GatewaySettings, Usage } from './gateway';
import type { Occurrence, UniverseCount } from './night';
import { DEFAULT_PROMPT, type PromptTemplate, type Universe } from './prompt';
import { MISTRAL_URL, type Provider } from './providers';

/**
 * What the database gives the Edge Function (coach_context, coach_night_plan, coach_cached), read
 * into the gateway's types. API keys never live in the database: they come from the function's
 * secrets (MISTRAL_API_KEY, OWN_AI_API_KEY).
 */

export type Secrets = { mistralKey?: string; ownKey?: string };

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const num = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : fallback;
};
const text = (value: unknown) => (typeof value === 'string' ? value : '');

/** A provider as the back-office sets it, with its key; null when unusable. */
export function providerOf(value: unknown, secrets: Secrets): Provider | null {
  if (!isRow(value)) return null;
  const model = text(value.model).trim();
  if (!model) return null;
  const price = { input: num(value.price_input), output: num(value.price_output) };
  if (value.kind === 'mistral') {
    if (!secrets.mistralKey) return null;
    const baseUrl = text(value.base_url) || MISTRAL_URL;
    return { kind: 'mistral', baseUrl, model, apiKey: secrets.mistralKey, price };
  }
  if (value.kind === 'openai-compatible') {
    const baseUrl = text(value.base_url).trim();
    if (!/^https?:\/\//.test(baseUrl)) return null;
    return {
      kind: 'openai-compatible',
      baseUrl,
      model,
      apiKey: secrets.ownKey || undefined,
      price,
    };
  }
  return null;
}

function promptOf(value: unknown): PromptTemplate {
  if (!isRow(value)) return DEFAULT_PROMPT;
  const system = text(value.system);
  const user = text(value.user);
  return system && user ? { version: num(value.version, 1), system, user } : DEFAULT_PROMPT;
}

const universesOf = (value: unknown): Universe[] =>
  (Array.isArray(value) ? value : []).filter(isRow).map((row) => ({
    id: text(row.id),
    name: text(row.name),
    vocabulary: isRow(row.vocabulary)
      ? {
          words: Array.isArray(row.vocabulary.words)
            ? row.vocabulary.words.filter((w) => typeof w === 'string')
            : [],
          images: Array.isArray(row.vocabulary.images)
            ? row.vocabulary.images.filter((w) => typeof w === 'string')
            : [],
        }
      : {},
  }));

/** A universe as the database writes it ({ id, name, vocabulary }); null if there is none. */
export function readUniverse(value: unknown): Universe | null {
  const [universe] = universesOf([value]);
  return universe?.id ? universe : null;
}

/** The settings of the gateway from { settings, prompt, banned, spent }. */
export function readSettings(value: unknown, secrets: Secrets): GatewaySettings {
  const context = isRow(value) ? value : {};
  const settings = isRow(context.settings) ? context.settings : {};
  const spent = isRow(context.spent) ? context.spent : {};
  return {
    enabled: settings.enabled === true,
    realtime: providerOf(settings.realtime_provider, secrets),
    night: providerOf(settings.night_provider, secrets),
    moderation:
      settings.moderation === true && secrets.mistralKey
        ? {
            kind: 'mistral',
            baseUrl: MISTRAL_URL,
            model: 'mistral-moderation-latest',
            apiKey: secrets.mistralKey,
            price: { input: 0, output: 0 },
          }
        : null,
    dailyCapUsd: num(settings.daily_cap_usd),
    monthlyCapUsd: num(settings.monthly_cap_usd),
    spentTodayUsd: num(spent.today),
    spentMonthUsd: num(spent.month),
    banned: (Array.isArray(context.banned) ? context.banned : []).filter(
      (word): word is string => typeof word === 'string',
    ),
    prompt: promptOf(context.prompt),
  };
}

export type ChildContext = { grade: Grade; universes: Universe[]; settings: GatewaySettings };

/** coach_context's answer; null for an unknown child. */
export function readChildContext(value: unknown, secrets: Secrets): ChildContext | null {
  if (!isRow(value)) return null;
  const grade = GRADES.find((item) => item === value.grade);
  if (!grade) return null;
  return { grade, universes: universesOf(value.universes), settings: readSettings(value, secrets) };
}

export type NightPlan = {
  settings: GatewaySettings;
  occurrences: Occurrence[];
  universes: UniverseCount[];
  /** Combinations written, or tried tonight. */
  existing: Set<string>;
  /** What is left of the night's batch. */
  remaining: number;
};

/** coach_night_plan's answer. */
export function readNightPlan(value: unknown, secrets: Secrets): NightPlan {
  const plan = isRow(value) ? value : {};
  return {
    settings: readSettings(plan, secrets),
    occurrences: (Array.isArray(plan.occurrences) ? plan.occurrences : [])
      .filter(isRow)
      .map((row) => ({
        band: text(row.band),
        skill: text(row.skill),
        error: typeof row.error === 'string' ? row.error : null,
        count: num(row.count),
      })),
    universes: (Array.isArray(plan.universes) ? plan.universes : [])
      .filter(isRow)
      .flatMap((row) => {
        const [universe] = universesOf([row.universe]);
        return universe?.id ? [{ band: text(row.band), universe, count: num(row.count) }] : [];
      }),
    existing: new Set(
      (Array.isArray(plan.existing) ? plan.existing : []).filter(
        (key): key is string => typeof key === 'string',
      ),
    ),
    remaining: Math.max(0, Math.floor(num(plan.remaining))),
  };
}

/** An explanation as stored ({ what, image, tip }); null if damaged. */
export function readTemplate(value: unknown): Explanation | null {
  if (!isRow(value)) return null;
  const { what, image, tip } = value;
  return typeof what === 'string' && typeof image === 'string' && typeof tip === 'string'
    ? { what, image, tip }
    : null;
}

/** A call to a model, as coach_log_usage stores it. The child's id never reaches a model. */
export const usageRow = (usage: Usage, childId: string | null) => ({
  task: usage.task,
  provider: usage.provider,
  model: usage.model,
  tokens_in: usage.tokensIn,
  tokens_out: usage.tokensOut,
  cost_usd: usage.costUsd,
  latency_ms: Math.round(usage.latencyMs),
  outcome: usage.outcome,
  problems: usage.problems,
  child_id: childId,
  skill_code: usage.key?.skill ?? null,
  error_type: usage.key?.error ?? null,
  universe_id: usage.key?.universe ?? null,
  grade_band: usage.key?.band ?? null,
  prompt_version: usage.promptVersion,
});
