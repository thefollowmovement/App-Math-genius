// Computes the learning profiles that are due (docs/specs.md: recomputed every night): those of
// children whose parent agreed and whose profile is older than 20 hours. Called every hour by
// pg_cron (private.request_profile_refresh, through pg_net) with the service key; nobody else.
import { refreshProfile } from '../_shared/profiles.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
/** Profiles per call; the next hour takes the rest. */
const BATCH = 100;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function rest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.json();
}

Deno.serve(async (request) => {
  if (!SERVICE_ROLE_KEY || request.headers.get('Authorization') !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return json({ error: 'unauthorized' }, 401);
  }
  const due: string[] = await rest('rpc/profiles_due', {
    method: 'POST',
    body: JSON.stringify({ p_limit: BATCH }),
  });
  let computed = 0;
  let failed = 0;
  for (const childId of due) {
    try {
      if (await refreshProfile(rest, childId)) computed += 1;
    } catch (error) {
      failed += 1;
      console.error('learner profile', childId, error);
    }
  }
  return json({ due: due.length, computed, failed });
});
