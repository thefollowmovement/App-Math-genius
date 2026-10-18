// Awards a child's finished sessions. Each answer is graded again here with the exercise engine
// (engine.js, bundled from packages/exercise-engine); the database then computes XP, gems, streak
// and chest from these verdicts only (award_session). Called by the app after each sync, with the
// caller's own token: Row Level Security decides which sessions it may have awarded.
import { regrade } from './engine.js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Sessions awarded per call; the next sync awards the rest. */
const MAX_SESSIONS = 20;

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

/** The server itself: only it may call award_session. */
const SERVER: Credentials = {
  apikey: SERVICE_ROLE_KEY,
  authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

/** PostgREST, as the caller (their token, RLS applies) or as the server. */
async function rest(path: string, credentials: Credentials, init: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: credentials.apikey,
      Authorization: credentials.authorization,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new HttpError(response.status, await response.text());
  return response.json();
}

async function awardChild(childId: string, caller: Credentials) {
  const pending: { id: string }[] = await rest(
    `sessions?child_id=eq.${childId}&completed_at=not.is.null&awarded_at=is.null` +
      `&select=id&order=completed_at&limit=${MAX_SESSIONS}`,
    caller,
  );
  const awards = [];
  for (const { id } of pending) {
    const answers = await rest(
      `attempts?session_id=eq.${id}&select=position,generator_id,difficulty,seed,answer&order=position`,
      caller,
    );
    awards.push(
      await rest('rpc/award_session', SERVER, {
        method: 'POST',
        body: JSON.stringify({ p_session_id: id, p_verdicts: regrade(answers) }),
      }),
    );
  }
  return awards;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const body = await request.json().catch(() => null);
    const childId = body?.child_id;
    if (typeof childId !== 'string' || !UUID.test(childId)) return json({ error: 'child_id' }, 400);
    // The app's own key (publishable or legacy anon) and the user's token: PostgREST checks both.
    const authorization = request.headers.get('Authorization') ?? '';
    if (!authorization.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);
    const apikey = request.headers.get('apikey') ?? ANON_KEY;
    return json({ awards: await awardChild(childId, { apikey, authorization }) });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return json({ error: error instanceof Error ? error.message : 'error' }, status);
  }
});
