import { GRADES, type Grade } from '@math-genius/shared';

import { bannedWordsIn } from './checks';
import { readSettings, type Secrets } from './context';
import type { GatewaySettings, Outcome, Usage } from './gateway';
import type { PromptTemplate } from './prompt';
import { type Fetch, type Provider, ProviderError, callCost, chat, moderate } from './providers';

/**
 * The coach's three tips to the parent in the monthly recap (docs/specs.md, Récap mensuel). The
 * code writes the month's facts and the learning profile's summary; the model only turns them
 * into actions for the parent, without a single digit (the recap's numbers come from the
 * database) and without the child's name, which it never receives. Same switch, budget, banned
 * words and moderation as the explanations. Whatever fails, the recap shows the standard tips
 * (services/recaps).
 */

export const ADVICE_TIPS = 3;
export const MAX_TIP_WORDS = 35;
const MIN_TIP_WORDS = 4;
const TIMEOUT_MS = 20_000;
const MAX_TOKENS = 350;

/** Version 1, as the migration loads it (ai_prompts, task « advice »). */
export const DEFAULT_ADVICE_PROMPT: PromptTemplate = {
  version: 1,
  system: [
    'Tu es le coach d’une app de maths pour enfants. Tu écris au parent trois conseils concrets pour le mois qui vient, à partir du bilan que l’app a calculé et du profil d’apprentissage de son enfant.',
    'Le code a déjà tout calculé : tu ne calcules rien et tu n’écris aucun chiffre.',
    'Tu vouvoies le parent et tu parles de « votre enfant », jamais d’un prénom. Ton bienveillant, sans culpabiliser : pas de reproche, pas de comparaison avec d’autres enfants, pas de diagnostic.',
    'Chaque conseil est une action simple, à faire à la maison ou avec l’app, en une phrase de moins de trente mots.',
    'Réponds uniquement en JSON : {"tips": ["premier conseil", "deuxième conseil", "troisième conseil"]}.',
  ].join('\n'),
  user: [
    'Classe : {{classe}}.',
    'Bilan du mois : {{bilan}}',
    'Profil d’apprentissage : {{profil}}',
  ].join('\n'),
};

export type AdviceInput = {
  grade: Grade;
  /** The month as the code sums it up, one fact a line (numbers included). */
  facts: readonly string[];
  /** The learning profile's summary (profileSummary), with the parent's consent. */
  summary: string | null;
};

export function buildAdvicePrompt(template: PromptTemplate, input: AdviceInput) {
  const fields: Record<string, string> = {
    classe: input.grade,
    bilan: input.facts.map((fact) => `- ${fact}`).join('\n') || '(rien de notable)',
    profil: input.summary?.trim() || '(pas de profil)',
  };
  const fill = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (all, name: string) => fields[name] ?? all);
  return { system: fill(template.system), user: fill(template.user) };
}

/** The tips of the model's answer ({ "tips": [...] }, possibly in a code block). */
export function parseAdvice(text: string): string[] | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let value: unknown;
  try {
    value = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const { tips } = value as Record<string, unknown>;
  if (!Array.isArray(tips) || !tips.every((tip) => typeof tip === 'string')) return null;
  return tips.map((tip) => tip.trim().replace(/\s+/g, ' '));
}

export type AdviceProblem = 'unreadable' | 'count' | 'length' | 'digits' | 'banned-word';

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Checks that need no network; the moderation model comes after. */
export function adviceProblems(
  tips: readonly string[] | null,
  banned: readonly string[],
): AdviceProblem[] {
  if (!tips) return ['unreadable'];
  const problems = new Set<AdviceProblem>();
  if (tips.length !== ADVICE_TIPS) problems.add('count');
  for (const tip of tips) {
    const count = words(tip);
    if (count < MIN_TIP_WORDS || count > MAX_TIP_WORDS) problems.add('length');
    if (/\d/.test(tip)) problems.add('digits');
    if (bannedWordsIn(tip, banned).length > 0) problems.add('banned-word');
  }
  return [...problems];
}

export type AdviceSettings = Pick<
  GatewaySettings,
  | 'enabled'
  | 'realtime'
  | 'night'
  | 'moderation'
  | 'dailyCapUsd'
  | 'monthlyCapUsd'
  | 'spentTodayUsd'
  | 'spentMonthUsd'
  | 'banned'
> & { prompt: PromptTemplate };

export type AdviceResult =
  | { ok: true; tips: string[] }
  | { ok: false; reason: 'off' | 'no-provider' | 'budget' | 'failed' | 'rejected' };

const withinBudget = (settings: AdviceSettings, provider: Provider) =>
  (provider.price.input === 0 && provider.price.output === 0) ||
  (settings.spentTodayUsd < settings.dailyCapUsd &&
    settings.spentMonthUsd < settings.monthlyCapUsd);

/** Asks the model for the month's three tips and checks them before they are kept. */
export async function advise(
  input: AdviceInput,
  settings: AdviceSettings,
  store: { logUsage(usage: Usage): Promise<void> },
  fetcher: Fetch = fetch,
): Promise<AdviceResult> {
  if (!settings.enabled) return { ok: false, reason: 'off' };
  // Not urgent: the real-time model, else the night's server of our own.
  const provider = settings.realtime ?? settings.night;
  if (!provider) return { ok: false, reason: 'no-provider' };
  if (!withinBudget(settings, provider)) return { ok: false, reason: 'budget' };

  const usage = (fields: Partial<Usage>): Usage => ({
    task: 'advice',
    provider: provider.kind,
    model: provider.model,
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
    latencyMs: 0,
    outcome: 'ok',
    problems: [],
    key: null,
    promptVersion: settings.prompt.version,
    ...fields,
  });
  let result;
  try {
    result = await chat(
      provider,
      {
        ...buildAdvicePrompt(settings.prompt, input),
        maxTokens: MAX_TOKENS,
        temperature: 0.6,
        timeoutMs: TIMEOUT_MS,
      },
      fetcher,
    );
  } catch (failure) {
    await store.logUsage(
      usage({
        outcome: 'error',
        latencyMs: failure instanceof ProviderError ? failure.latencyMs : 0,
        problems: [failure instanceof Error ? failure.message : 'error'],
      }),
    );
    return { ok: false, reason: 'failed' };
  }
  const spent = {
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
    costUsd: callCost(provider, result.tokensIn, result.tokensOut),
    latencyMs: result.latencyMs,
  };
  const tips = parseAdvice(result.text);
  let problems: string[] = adviceProblems(tips, settings.banned);
  if (problems.length === 0 && tips && settings.moderation) {
    try {
      const flagged = await moderate(settings.moderation, tips.join('\n'), fetcher);
      if (flagged.length > 0) problems = ['moderation'];
    } catch {
      // Unchecked is not kept.
      problems = ['moderation'];
    }
  }
  const outcome: Outcome = problems.length === 0 ? 'ok' : tips ? 'rejected' : 'unreadable';
  await store.logUsage(usage({ ...spent, outcome, problems }));
  return outcome === 'ok' && tips ? { ok: true, tips } : { ok: false, reason: 'rejected' };
}

export type AdviceContext = { grade: Grade; settings: AdviceSettings };

/** advice_context's answer; null for an unknown child. */
export function readAdviceContext(value: unknown, secrets: Secrets): AdviceContext | null {
  if (typeof value !== 'object' || value === null) return null;
  const context = value as Record<string, unknown>;
  const grade = GRADES.find((item) => item === context.grade);
  if (!grade) return null;
  const settings = readSettings(context, secrets);
  const prompt =
    typeof context.prompt === 'object' && context.prompt !== null
      ? (context.prompt as Record<string, unknown>)
      : {};
  const system = typeof prompt.system === 'string' ? prompt.system : '';
  const user = typeof prompt.user === 'string' ? prompt.user : '';
  return {
    grade,
    settings: {
      ...settings,
      prompt:
        system && user
          ? { version: typeof prompt.version === 'number' ? prompt.version : 1, system, user }
          : DEFAULT_ADVICE_PROMPT,
    },
  };
}
