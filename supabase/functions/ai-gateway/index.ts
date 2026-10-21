// The AI coach (docs/specs.md, Coach IA ; services/ai-gateway, bundled in _shared/ai-gateway.js).
//
// - explain (the app, after a wrong answer, with the child's device or parent token): the
//   exercise is rebuilt here from its generator, difficulty and seed; a validated explanation comes
//   from the cache, or from the model when the AI is on and within its budget, checked before it is
//   sent. Whatever fails, the answer is { source: 'standard' }: the app shows the generator's own
//   correction.
// - night (pg_cron, private.request_coach_night, with the service key): writes ahead the
//   explanations missing for the most frequent mistakes.
// - preview (the back-office, an editor's token): tries a prompt being written, keeps nothing.
//
// API keys are this function's secrets (MISTRAL_API_KEY, OWN_AI_API_KEY), never in the database.
// Nothing that identifies a child reaches a model: the prompt holds the exercise, the mistake, the
// age group and a universe's name only.
import {
  explain,
  keyString,
  nightJobs,
  parseCoachRequest,
  parsePreviewRequest,
  pregenerate,
  preview,
  readChildContext,
  readNightPlan,
  readSettings,
  readTemplate,
  readUniverse,
  usageRow,
} from '../_shared/ai-gateway.js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SECRETS = {
  mistralKey: Deno.env.get('MISTRAL_API_KEY') || undefined,
  ownKey: Deno.env.get('OWN_AI_API_KEY') || undefined,
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

type Credentials = { apikey: string; authorization: string };

const SERVER: Credentials = {
  apikey: SERVICE_ROLE_KEY,
  authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

/** PostgREST, as the caller (their token, RLS applies) or as the server. */
async function rest(path: string, credentials: Credentials, body?: unknown) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      apikey: credentials.apikey,
      Authorization: credentials.authorization,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new HttpError(response.status, await response.text());
  // A function returning void answers with no content.
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

type Key = { skill: string; error: string | null; universe: string | null; band: string };
type Usage = Parameters<typeof usageRow>[0];

/** The gateway's cache and logs, in the database; the child only to sum costs per child. */
const store = (childId: string | null) => ({
  async cached(key: Key, exclude: readonly string[]) {
    const rows: { id: string; content: unknown }[] = await rest('rpc/coach_cached', SERVER, {
      p_skill_code: key.skill,
      p_error_type: key.error,
      p_universe_id: key.universe,
      p_grade_band: key.band,
      p_exclude: exclude,
    });
    return rows.flatMap((row) => {
      const template = readTemplate(row.content);
      return template ? [{ id: row.id, template }] : [];
    });
  },
  save: (entry: { key: Key; template: unknown; model: string; promptVersion: number }) =>
    rest('rpc/coach_save_explanation', SERVER, {
      p_skill_code: entry.key.skill,
      p_error_type: entry.key.error,
      p_universe_id: entry.key.universe,
      p_grade_band: entry.key.band,
      p_content: entry.template,
      p_model: entry.model,
      p_prompt_version: entry.promptVersion,
    }),
  async logUsage(usage: Usage) {
    await rest('rpc/coach_log_usage', SERVER, { p_usage: usageRow(usage, childId) });
  },
});

async function explainMistake(body: unknown, caller: Credentials) {
  const request = parseCoachRequest(body);
  if (!request) throw new HttpError(400, 'request');
  // The caller's token: a device or parent of this child only (RLS).
  const visible: unknown[] = await rest(`children?id=eq.${request.childId}&select=id`, caller);
  if (visible.length === 0) throw new HttpError(404, 'child_not_found');
  const context = readChildContext(
    await rest('rpc/coach_context', SERVER, { p_child_id: request.childId }),
    SECRETS,
  );
  if (!context) throw new HttpError(404, 'child_not_found');
  try {
    const result = await explain(
      {
        exercise: request.exercise,
        response: request.response,
        grade: context.grade,
        universes: context.universes,
        exclude: request.exclude,
      },
      context.settings,
      store(request.childId),
    );
    if (result.source !== 'standard') {
      await rest('rpc/coach_shown', SERVER, { p_explanation_id: result.id }).catch(() => null);
    }
    return result;
  } catch (error) {
    console.error('coach', error);
    return { source: 'standard', reason: 'failed' };
  }
}

async function night() {
  const plan = readNightPlan(await rest('rpc/coach_night_plan', SERVER, {}), SECRETS);
  const jobs = nightJobs({
    occurrences: plan.occurrences,
    universes: plan.universes,
    existing: plan.existing,
    limit: plan.remaining,
  });
  const counts = await pregenerate(jobs, plan.settings, store(null));
  return { jobs: jobs.length, ...counts };
}

const EDITORS = ['editor', 'super_admin'];

async function tryPrompt(body: unknown, caller: Credentials) {
  const role = await rest('rpc/admin_whoami', caller, {});
  if (!EDITORS.includes(role)) throw new HttpError(403, 'admin_only');
  const request = parsePreviewRequest(body);
  if (!request) throw new HttpError(400, 'request');
  const context = await rest('rpc/coach_preview_context', SERVER, {
    p_universe_id: request.universe,
  });
  const universe = readUniverse(context?.universe);
  const key = {
    skill: request.skill,
    error: request.error,
    universe: universe?.id ?? null,
    band: request.band,
  };
  const result = await preview(
    { key, universe, prompt: request.prompt, night: request.night },
    { ...readSettings(context, SECRETS), prompt: request.prompt },
    store(null),
  );
  return { key: keyString(key), ...result };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const body = await request.json().catch(() => null);
    const authorization = request.headers.get('Authorization') ?? '';
    const task = body?.task ?? 'explain';
    if (task === 'night') {
      if (!SERVICE_ROLE_KEY || authorization !== `Bearer ${SERVICE_ROLE_KEY}`) {
        return json({ error: 'unauthorized' }, 401);
      }
      return json(await night());
    }
    // The app's own key (publishable or legacy anon) and the user's token: PostgREST checks both.
    if (!authorization.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);
    const caller = { apikey: request.headers.get('apikey') ?? ANON_KEY, authorization };
    if (task === 'preview') return json(await tryPrompt(body, caller));
    if (task === 'explain') return json(await explainMistake(body, caller));
    return json({ error: 'task' }, 400);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return json({ error: error instanceof Error ? error.message : 'error' }, status);
  }
});
