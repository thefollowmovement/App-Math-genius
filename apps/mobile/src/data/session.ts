import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

/** A parent signs in with email; a child device holds an anonymous session once paired. */
export type AccountKind = 'parent' | 'device';

type SessionState = { session: Session | null; ready: boolean };

export const useSessionStore = create<SessionState>(() => ({ session: null, ready: false }));

let listening = false;

/** Loads the stored session and follows sign-ins, sign-outs and token refreshes. */
export function startSessionListener() {
  if (listening) return;
  listening = true;

  supabase.auth.getSession().then(({ data }) => {
    useSessionStore.setState({ session: data.session, ready: true });
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    useSessionStore.setState({ session, ready: true });
  });
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
