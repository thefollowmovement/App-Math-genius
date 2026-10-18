import { onlineManager, useQuery } from '@tanstack/react-query';
import { AppState } from 'react-native';

import { requestAwards } from '@/data/rewards';
import { supabase } from '@/lib/supabase';

import { mergeMastery, setItemRatings } from './practice-store';
import {
  itemRatingsFromRows,
  masteryFromRows,
  sendPendingSessions,
  type SyncTransport,
} from './sync-engine';

const send: SyncTransport = async (payload) => {
  const { error } = await supabase.rpc('sync_session', { p_session: payload });
  if (error) throw error;
};

/** The device lost access to the child (revoked, child deleted): the session cannot be sent. */
const isPermanent = (error: unknown) =>
  error instanceof Object &&
  'message' in error &&
  /child_not_found|session_conflict/.test(String(error.message));

let running: Promise<void> | null = null;
let again = false;

/** Rewards are computed by the server; offline or failing, the next sync asks again. */
const award = (childId: string) => requestAwards(childId).catch(() => []);

/**
 * Sends what is waiting, once at a time; a call during a run triggers one more run. Finished
 * sessions that reach the server are then awarded.
 */
export function syncNow(): Promise<void> {
  if (!onlineManager.isOnline()) return Promise.resolve();
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      const { finished } = await sendPendingSessions(send, isPermanent);
      for (const childId of finished) void award(childId);
    } while (again);
  })().finally(() => {
    running = null;
  });
  return running;
}

let triggers = false;

/** Syncs when the network comes back and when the app returns to the foreground. */
export function startSyncTriggers() {
  if (triggers) return;
  triggers = true;
  onlineManager.subscribe((online) => {
    if (online) void syncNow();
  });
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void syncNow();
  });
}

async function pull(childId: string) {
  await syncNow();
  // Catches up on sessions finished elsewhere or whose award failed.
  await award(childId);
  const [mastery, ratings] = await Promise.all([
    supabase
      .from('child_skill_mastery')
      .select('skill_code, elo, attempts_count, sessions_streak, mastered_at, last_practiced_at')
      .eq('child_id', childId),
    supabase.from('item_ratings').select('generator_id, difficulty, rating'),
  ]);
  if (mastery.error) throw mastery.error;
  if (ratings.error) throw ratings.error;
  mergeMastery(childId, masteryFromRows(mastery.data));
  setItemRatings(itemRatingsFromRows(ratings.data));
  return Date.now();
}

/**
 * Sends the child's pending sessions and brings back mastery from other devices and the item
 * ratings. Paused offline; runs again when the network returns.
 */
export function usePracticeSync(childId: string | undefined) {
  return useQuery({
    queryKey: ['practice-sync', childId],
    enabled: childId !== undefined,
    queryFn: () => pull(childId ?? ''),
    staleTime: 60_000,
  });
}
