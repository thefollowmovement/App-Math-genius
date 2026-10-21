import {
  type ErrorTypeCode,
  type SkillCode,
  getErrorType,
  getSkill,
} from '@math-genius/curriculum';
import {
  type Exercise,
  type ExerciseResponse,
  type Explanation,
  answerText,
  coachFrame,
  coachSample,
  diagnoseResponse,
  givenText,
  gradeResponse,
  showableExplanation,
} from '@math-genius/exercise-engine';
import { type Grade, type GradeBand, gradeBand } from '@math-genius/shared';

import { type CheckProblem, checkExplanation, explanationText, parseExplanation } from './checks';
import { bandGrade } from './night';
import { type PromptTemplate, type Universe, buildPrompt } from './prompt';
import {
  type Fetch,
  type Provider,
  type ProviderKind,
  ProviderError,
  callCost,
  chat,
  moderate,
} from './providers';

/**
 * The coach's gateway (docs/specs.md, Coach IA : déroulé après une erreur): a validated explanation
 * from the cache first; otherwise, when the AI is on and the budget allows, a new one from the
 * model, checked before it is shown and kept for the next children. Whatever fails, the app shows
 * the generator's own correction: it never depends on the AI.
 */

export type CacheKey = {
  skill: SkillCode;
  error: ErrorTypeCode | null;
  /** Null: examples from everyday life. */
  universe: string | null;
  band: GradeBand;
};

export type CachedExplanation = { id: string; template: Explanation };

/** advice: the monthly recap's tips to the parent (advice.ts). */
export type Task = 'realtime' | 'night' | 'preview' | 'advice';
export type Outcome = 'ok' | 'rejected' | 'unreadable' | 'error';

export type Usage = {
  task: Task;
  provider: ProviderKind;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  outcome: Outcome;
  problems: readonly string[];
  key: CacheKey | null;
  promptVersion: number;
};

export interface GatewayStore {
  /** Explanations of the key that may be shown (approved first), leaving out those already seen. */
  cached(key: CacheKey, exclude: readonly string[]): Promise<CachedExplanation[]>;
  /** Keeps a checked explanation, waiting for a reviewer; its id. */
  save(entry: {
    key: CacheKey;
    template: Explanation;
    model: string;
    promptVersion: number;
  }): Promise<string>;
  logUsage(usage: Usage): Promise<void>;
}

export type GatewaySettings = {
  /** Off (the back-office's emergency switch): the generators' corrections only. */
  enabled: boolean;
  realtime: Provider | null;
  /** Our own server for the night's pre-generation; the real-time provider otherwise. */
  night: Provider | null;
  /** Mistral, for its moderation model; null without a key. */
  moderation: Provider | null;
  dailyCapUsd: number;
  monthlyCapUsd: number;
  spentTodayUsd: number;
  spentMonthUsd: number;
  banned: readonly string[];
  prompt: PromptTemplate;
};

const REALTIME_TIMEOUT_MS = 8000;
/** A night run ends within an Edge Function's 150 s: no call starts after NIGHT_RUN_MS. */
const NIGHT_TIMEOUT_MS = 45_000;
export const NIGHT_RUN_MS = 90_000;
const MAX_TOKENS = 400;

export type Generated =
  | { ok: true; template: Explanation; rendered: Explanation; usage: Usage; raw: string }
  | { ok: false; usage: Usage | null; raw: string | null; problems: readonly CheckProblem[] };

const withinBudget = (settings: GatewaySettings, provider: Provider) =>
  (provider.price.input === 0 && provider.price.output === 0) ||
  (settings.spentTodayUsd < settings.dailyCapUsd &&
    settings.spentMonthUsd < settings.monthlyCapUsd);

/** Asks the model for a template, then checks it on this exercise. */
export async function generate(
  input: {
    exercise: Exercise;
    response: ExerciseResponse;
    grade: Grade;
    universe: Universe | null;
    key: CacheKey;
    task: Task;
    prompt: PromptTemplate;
  },
  provider: Provider,
  settings: Pick<GatewaySettings, 'banned' | 'moderation'>,
  fetcher: Fetch = fetch,
): Promise<Generated> {
  const frame = coachFrame(input.exercise, input.response);
  const error = input.key.error;
  const messages = buildPrompt(input.prompt, {
    frame,
    grade: input.grade,
    band: input.key.band,
    skillTitle: getSkill(input.exercise.skill).title,
    errorLabel: error ? getErrorType(error).label : null,
    universe: input.universe,
  });
  const usage = (fields: Partial<Usage>): Usage => ({
    task: input.task,
    provider: provider.kind,
    model: provider.model,
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
    latencyMs: 0,
    outcome: 'ok',
    problems: [],
    key: input.key,
    promptVersion: input.prompt.version,
    ...fields,
  });
  let result;
  try {
    result = await chat(
      provider,
      {
        ...messages,
        maxTokens: MAX_TOKENS,
        temperature: 0.7,
        timeoutMs: input.task === 'realtime' ? REALTIME_TIMEOUT_MS : NIGHT_TIMEOUT_MS,
      },
      fetcher,
    );
  } catch (failure) {
    const latencyMs = failure instanceof ProviderError ? failure.latencyMs : 0;
    const message = failure instanceof Error ? failure.message : 'error';
    return {
      ok: false,
      usage: usage({ outcome: 'error', latencyMs, problems: [message] }),
      raw: null,
      problems: [],
    };
  }
  const spent = {
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
    costUsd: callCost(provider, result.tokensIn, result.tokensOut),
    latencyMs: result.latencyMs,
  };
  const template = parseExplanation(result.text);
  const checked = checkExplanation(template, frame, settings.banned);
  let problems: CheckProblem[] = checked.problems;
  if (problems.length === 0 && checked.rendered && settings.moderation) {
    try {
      const flagged = await moderate(
        settings.moderation,
        explanationText(checked.rendered),
        fetcher,
      );
      if (flagged.length > 0) problems = ['moderation'];
    } catch {
      // Unchecked is not shown.
      problems = ['moderation'];
    }
  }
  if (!template || !checked.rendered || problems.length > 0) {
    const outcome: Outcome = template ? 'rejected' : 'unreadable';
    return { ok: false, usage: usage({ ...spent, outcome, problems }), raw: result.text, problems };
  }
  return { ok: true, template, rendered: checked.rendered, usage: usage(spent), raw: result.text };
}

export type ExplainInput = {
  exercise: Exercise;
  response: ExerciseResponse;
  grade: Grade;
  /** The child's universes allowed for their grade, with consent; none: everyday life. */
  universes: readonly Universe[];
  /** Explanations already shown for this mistake (« Explique autrement »). */
  exclude: readonly string[];
};

export type StandardReason = 'correct' | 'off' | 'budget' | 'no-provider' | 'failed' | 'rejected';

export type ExplainResult =
  | {
      source: 'cache' | 'ai';
      id: string;
      /** With slots: the app renders and checks it again before showing it. */
      template: Explanation;
      explanation: Explanation;
      universe: string | null;
    }
  | { source: 'standard'; reason: StandardReason };

/** The universe of this explanation: one of the child's, another at each « Explique autrement ». */
export function pickUniverse(
  universes: readonly Universe[],
  seed: number,
  shown: number,
): Universe | null {
  if (universes.length === 0) return null;
  return universes[(seed + shown) % universes.length] ?? null;
}

export async function explain(
  input: ExplainInput,
  settings: GatewaySettings,
  store: GatewayStore,
  fetcher: Fetch = fetch,
): Promise<ExplainResult> {
  const { exercise, response } = input;
  if (gradeResponse(exercise, response).correct) return { source: 'standard', reason: 'correct' };
  const universe = pickUniverse(input.universes, exercise.seed, input.exclude.length);
  const key: CacheKey = {
    skill: exercise.skill,
    error: diagnoseResponse(exercise, response),
    universe: universe?.id ?? null,
    band: gradeBand(input.grade),
  };
  const frame = coachFrame(exercise, response);
  // The emergency switch leaves only the generators' corrections, cached explanations included.
  if (!settings.enabled) return { source: 'standard', reason: 'off' };

  // A validated explanation of the same skill, mistake, universe and age group: shown at once.
  for (const cached of await store.cached(key, input.exclude)) {
    const explanation = showableExplanation(cached.template, frame);
    if (explanation) {
      return {
        source: 'cache',
        id: cached.id,
        template: cached.template,
        explanation,
        universe: key.universe,
      };
    }
  }

  const provider = settings.realtime;
  if (!provider) return { source: 'standard', reason: 'no-provider' };
  if (!withinBudget(settings, provider)) return { source: 'standard', reason: 'budget' };

  const generated = await generate(
    {
      exercise,
      response,
      grade: input.grade,
      universe,
      key,
      task: 'realtime',
      prompt: settings.prompt,
    },
    provider,
    settings,
    fetcher,
  );
  if (generated.usage) await store.logUsage(generated.usage);
  if (!generated.ok) {
    return {
      source: 'standard',
      reason: generated.usage?.outcome === 'error' ? 'failed' : 'rejected',
    };
  }
  const id = await store.save({
    key,
    template: generated.template,
    model: provider.model,
    promptVersion: settings.prompt.version,
  });
  return {
    source: 'ai',
    id,
    template: generated.template,
    explanation: generated.rendered,
    universe: key.universe,
  };
}

export type NightJob = { key: CacheKey; universe: Universe | null; grade: Grade };

/**
 * The night's pre-generation (docs/specs.md): explanations written ahead for the combinations
 * still missing, on our own server when there is one. Several short runs a night: the jobs not
 * started before the deadline are left for the next run.
 */
export async function pregenerate(
  jobs: readonly NightJob[],
  settings: GatewaySettings,
  store: GatewayStore,
  fetcher: Fetch = fetch,
  clock: { now: () => number; deadline: number } = {
    now: Date.now,
    deadline: Date.now() + NIGHT_RUN_MS,
  },
): Promise<{ kept: number; rejected: number; failed: number; skipped: number }> {
  const counts = { kept: 0, rejected: 0, failed: 0, skipped: 0 };
  const provider = settings.night ?? settings.realtime;
  if (!settings.enabled || !provider) return { ...counts, skipped: jobs.length };
  let spent = 0;
  for (const job of jobs) {
    const affordable = withinBudget(
      { ...settings, spentTodayUsd: settings.spentTodayUsd + spent },
      provider,
    );
    const sample =
      affordable && clock.now() < clock.deadline ? coachSample(job.key.skill, job.key.error) : null;
    if (!sample) {
      counts.skipped += 1;
      continue;
    }
    const generated = await generate(
      {
        ...sample,
        grade: job.grade,
        universe: job.universe,
        key: job.key,
        task: 'night',
        prompt: settings.prompt,
      },
      provider,
      settings,
      fetcher,
    );
    if (generated.usage) {
      spent += generated.usage.costUsd;
      await store.logUsage(generated.usage);
    }
    if (generated.ok) {
      await store.save({
        key: job.key,
        template: generated.template,
        model: provider.model,
        promptVersion: settings.prompt.version,
      });
      counts.kept += 1;
    } else if (generated.usage?.outcome === 'error') {
      counts.failed += 1;
    } else {
      counts.rejected += 1;
    }
  }
  return counts;
}

export type PreviewInput = {
  key: CacheKey;
  universe: Universe | null;
  /** A version being written in the back-office, saved or not. */
  prompt: PromptTemplate;
  /** The night's server instead of the real-time model. */
  night: boolean;
};

export type PreviewResult =
  | { ok: false; reason: 'no-sample' | 'no-provider' | 'budget' }
  | {
      ok: true;
      /** The exercise the prompt was tried on, the wrong answer and the right one. */
      exercise: string;
      given: string;
      solution: string;
      generated: Generated;
    };

/**
 * The back-office tries a prompt on an exercise that shows the mistake (« test en direct »): the
 * same checks as for a child, nothing kept. Within the budget, even with the coach switched off,
 * so that a prompt can be fixed before it is switched on again.
 */
export async function preview(
  input: PreviewInput,
  settings: GatewaySettings,
  store: Pick<GatewayStore, 'logUsage'>,
  fetcher: Fetch = fetch,
): Promise<PreviewResult> {
  const provider = input.night ? (settings.night ?? settings.realtime) : settings.realtime;
  if (!provider) return { ok: false, reason: 'no-provider' };
  if (!withinBudget(settings, provider)) return { ok: false, reason: 'budget' };
  const sample = coachSample(input.key.skill, input.key.error);
  if (!sample) return { ok: false, reason: 'no-sample' };
  const generated = await generate(
    {
      ...sample,
      grade: bandGrade(input.key.band),
      universe: input.universe,
      key: input.key,
      task: 'preview',
      prompt: input.prompt,
    },
    provider,
    settings,
    fetcher,
  );
  if (generated.usage) await store.logUsage(generated.usage);
  return {
    ok: true,
    exercise: sample.exercise.prompt,
    given: givenText(sample.exercise, sample.response),
    solution: answerText(sample.exercise),
    generated,
  };
}
