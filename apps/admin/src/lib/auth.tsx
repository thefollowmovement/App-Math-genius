'use client';

import type { Session } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import type { AdminRole } from '@/models/navigation';

import { supabase } from './supabase';

export type Auth =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; userId: string; email: string; role: AdminRole | null };

const AuthContext = createContext<Auth>({ status: 'loading' });

/** The signed-in team member and their role (admin_whoami: null for anyone else). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const role = useQuery({
    queryKey: ['admin-role', userId],
    enabled: userId !== undefined,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_whoami');
      if (error) throw error;
      return data ?? null;
    },
    staleTime: 5 * 60_000,
  });

  let auth: Auth;
  if (session === undefined || (userId !== undefined && role.isPending)) {
    auth = { status: 'loading' };
  } else if (!session || userId === undefined) {
    auth = { status: 'signed-out' };
  } else {
    auth = {
      status: 'signed-in',
      userId,
      email: session.user.email ?? '',
      role: role.data ?? null,
    };
  }
  return <AuthContext value={auth}>{children}</AuthContext>;
}

export const useAuth = () => use(AuthContext);
