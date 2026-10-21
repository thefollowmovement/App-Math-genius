// The weekly and monthly recaps (docs/specs.md, Statistiques et récaps ; services/recaps, bundled
// in _shared/recaps.js with the coach's gateway and the exercise engine).
//
// - deliver (pg_cron, private.request_recaps, with the service key): for each recap waiting, the
//   month's three tips (the coach with the parent's consent, else the standard ones), the month's
//   PDF in the private bucket « recaps », then one email per parent who wants it, through Resend.
//   Without RESEND_API_KEY, only the notifications (sent by the database) go out.
// - pdf (the app, a parent's token): a signed link to a monthly recap's PDF, written now if need
//   be. Row Level Security decides whether the parent may read the recap.
// - unsubscribe (the email's link, GET or one-click POST, no token but the link's own): stops one
//   kind of recap, or all, by email.
//
// Secrets: RESEND_API_KEY, RECAPS_FROM (the sender, on a domain verified at Resend), APP_URL (the
// web app, for the email's button; optional), MISTRAL_API_KEY / OWN_AI_API_KEY (the coach).
import {
  deliverRecap,
  gatewayCoach,
  readDelivery,
  recapPdfLink,
  resendMailer,
  supabaseStorage,
  unsubscribedText,
} from '../_shared/recaps.js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || undefined;
const FROM = Deno.env.get('RECAPS_FROM') || 'Math Genius <onboarding@resend.dev>';
const APP_URL = Deno.env.get('APP_URL') || null;
// The address parents reach the functions at (the unsubscribe links); SUPABASE_URL otherwise.
const FUNCTIONS_URL =
  Deno.env.get('PUBLIC_FUNCTIONS_URL') || `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1`;
const SECRETS = {
  mistralKey: Deno.env.get('MISTRAL_API_KEY') || undefined,
  ownKey: Deno.env.get('OWN_AI_API_KEY') || undefined,
};

/** Recaps per run, and no new one after this long (an Edge Function stops after 150 s). */
const BATCH = 20;
const RUN_MS = 100_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

const plainText = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

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

const rpc = (name: string, body: Record<string, unknown>) => rest(`rpc/${name}`, SERVER, body);

type Advice = { source: 'ai' | 'standard'; tips: string[] };

const store = {
  async save(recapId: string, change: { advice?: Advice; pdfPath?: string }) {
    await rpc('recap_save', {
      p_recap_id: recapId,
      p_advice: change.advice ?? null,
      p_pdf_path: change.pdfPath ?? null,
    });
  },
  async emailResult(recapId: string, parentId: string, result: { id: string } | { error: string }) {
    await rpc('recap_email_result', {
      p_recap_id: recapId,
      p_parent_id: parentId,
      p_provider_id: 'id' in result ? result.id : null,
      p_error: 'error' in result ? result.error : null,
    });
  },
  async done(recapId: string, error: string | null) {
    await rpc('recap_done', { p_recap_id: recapId, p_error: error });
  },
};

const storage = supabaseStorage(SUPABASE_URL, SERVICE_ROLE_KEY);

const deps = {
  store,
  storage,
  mailer: RESEND_API_KEY ? resendMailer(RESEND_API_KEY) : null,
  coach: gatewayCoach(rpc, SECRETS),
  from: FROM,
  functionsUrl: FUNCTIONS_URL,
  appUrl: APP_URL,
  now: () => new Date(),
};

async function deliver() {
  const deadline = Date.now() + RUN_MS;
  // PDFs of deleted recaps first: a child removed leaves nothing behind.
  const trash: string[] = (await rpc('recap_files_to_delete', { p_limit: 100 })) ?? [];
  if (trash.length > 0) {
    await storage.remove(trash);
    await rpc('recap_files_deleted', { p_paths: trash });
  }
  const waiting: unknown[] = (await rpc('recaps_to_deliver', { p_limit: BATCH })) ?? [];
  const counts = { recaps: 0, sent: 0, failed: 0, skipped: 0 };
  for (const item of waiting) {
    if (Date.now() > deadline) {
      counts.skipped += 1;
      continue;
    }
    const delivery = readDelivery(item);
    if (!delivery) {
      counts.failed += 1;
      continue;
    }
    try {
      const result = await deliverRecap(delivery, deps);
      counts.recaps += 1;
      counts.sent += result.sent;
      counts.failed += result.failed;
    } catch (error) {
      counts.failed += 1;
      console.error('recap', delivery.id, error);
      await store
        .done(delivery.id, error instanceof Error ? error.message : 'error')
        .catch(() => null);
    }
  }
  return { trash: trash.length, ...counts };
}

async function pdfLink(body: Record<string, unknown> | null, caller: Credentials) {
  const recapId = body?.recap_id;
  if (typeof recapId !== 'string' || !UUID.test(recapId)) throw new HttpError(400, 'recap_id');
  // The caller's token: a parent of this child only (RLS).
  const visible: unknown[] = await rest(`recaps?id=eq.${recapId}&select=id`, caller).catch(
    () => [],
  );
  if (visible.length === 0) throw new HttpError(404, 'recap_not_found');
  const delivery = readDelivery(await rpc('recap_delivery', { p_recap_id: recapId }));
  if (!delivery) throw new HttpError(404, 'recap_not_found');
  if (delivery.kind !== 'monthly') throw new HttpError(400, 'not_monthly');
  return { url: await recapPdfLink(delivery, deps) };
}

async function unsubscribe(url: URL) {
  const token = url.searchParams.get('token') ?? '';
  const kind = url.searchParams.get('kind') ?? '';
  const done =
    UUID.test(token) &&
    (await rpc('recap_unsubscribe', { p_token: token, p_kind: kind }).catch(() => false)) === true;
  return plainText(unsubscribedText('fr', kind, done), done ? 200 : 404);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const url = new URL(request.url);
    if (url.searchParams.get('task') === 'unsubscribe') return await unsubscribe(url);

    const body = await request.json().catch(() => null);
    const authorization = request.headers.get('Authorization') ?? '';
    if (body?.task === 'deliver') {
      if (!SERVICE_ROLE_KEY || authorization !== `Bearer ${SERVICE_ROLE_KEY}`) {
        return json({ error: 'unauthorized' }, 401);
      }
      return json(await deliver());
    }
    // The app's own key (publishable or legacy anon) and the user's token: PostgREST checks both.
    if (!authorization.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);
    const caller = { apikey: request.headers.get('apikey') ?? ANON_KEY, authorization };
    if (body?.task === 'pdf') return json(await pdfLink(body, caller));
    return json({ error: 'task' }, 400);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return json({ error: error instanceof Error ? error.message : 'error' }, status);
  }
});
