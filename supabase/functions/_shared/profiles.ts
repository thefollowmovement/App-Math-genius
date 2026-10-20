// The learning profile of a child, computed by the exercise engine from what the database gathers
// (profile_input) and stored with its summary (save_learner_profile). Both run as the server; the
// database returns nothing, and stores nothing, without the parent's consent.
import { profileFromInput } from './engine.js';

/** PostgREST as the server: a path under /rest/v1 and the request. */
export type ServerRest = (path: string, init: RequestInit) => Promise<unknown>;

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

/** True when a profile was stored. */
export async function refreshProfile(rest: ServerRest, childId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const input = await rest('rpc/profile_input', post({ p_child_id: childId, p_now: now }));
  const computed = profileFromInput(input, now);
  if (!computed) return false;
  const saved = await rest(
    'rpc/save_learner_profile',
    post({
      p_child_id: childId,
      p_profile: computed.profile,
      p_summary: computed.summary,
      p_computed_at: now,
    }),
  );
  return saved === true;
}
