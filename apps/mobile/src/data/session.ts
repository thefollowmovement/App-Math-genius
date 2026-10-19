import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { secureStorage } from '@/lib/secure-storage';
import { AUTH_STORAGE_KEY, supabase } from '@/lib/supabase';

/** A parent signs in with email; a child device holds an anonymous session once paired. */
export type AccountKind = 'parent' | 'device';

type SessionState = { session: Session | null; ready: boolean };

export const useSessionStore = create<SessionState>(() => ({ session: null, ready: false }));

let listening = false;

/** Loads the stored session and follows sign-ins, sign-outs and token refreshes. */
export function startSessionListener() {
  if (listening) return;
  listening = true;

  supabase.auth.getSession().then(async ({ data, error }) => {
    const session =
      data.session ?? (error && isAuthRetryableFetchError(error) ? await storedSession() : null);
    useSessionStore.setState({ session, ready: true });
  });
  supabase.auth.onAuthStateChange((event, session) => {
    // The initial session comes from getSession above, which also handles the offline case.
    if (event === 'INITIAL_SESSION') return;
    useSessionStore.setState({ session, ready: true });
  });
}

/**
 * Offline with an expired access token, Supabase cannot refresh it and reports no session, yet
 * keeps it in storage: the child can still play, and the token is refreshed once back online.
 */
async function storedSession(): Promise<Session | null> {
  try {
    const stored = await secureStorage.getItem(AUTH_STORAGE_KEY);
    const session: unknown = stored ? JSON.parse(stored) : null;
    return isSession(session) ? session : null;
  } catch {
    return null;
  }
}

function isSession(value: unknown): value is Session {
  return (
    typeof value === 'object' &&
    value !== null &&
    'refresh_token' in value &&
    'user' in value &&
    typeof value.user === 'object' &&
    value.user !== null &&
    'id' in value.user
  );
}

export function accountKind(session: Session | null): AccountKind | null {
  if (!session) return null;
  return session.user.is_anonymous ? 'device' : 'parent';
}

export function useAccountKind(): AccountKind | null {
  return useSessionStore((state) => accountKind(state.session));
}

export function useUserId(): string | undefined {
  return useSessionStore((state) => state.session?.user.id);
}
