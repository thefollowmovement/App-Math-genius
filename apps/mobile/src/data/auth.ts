import { PRIVACY_POLICY_VERSION, type ParentSignIn, type ParentSignUp } from '@math-genius/shared';
import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { queryClient } from './query-client';

/** The database creates the family when the metadata carries the privacy consent. */
export function useParentSignUp() {
  return useMutation({
    mutationFn: async ({ displayName, email, password }: ParentSignUp) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, privacy_consent_version: PRIVACY_POLICY_VERSION },
        },
      });
      if (error) throw error;
    },
  });
}

export function useParentSignIn() {
  return useMutation({
    mutationFn: async ({ email, password }: ParentSignIn) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
  });
}

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      queryClient.clear();
    },
  });
}
