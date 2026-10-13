import type { Enums } from '@math-genius/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export type PairingCode = { code: string; expiresAt: Date };

export function useCreatePairingCode() {
  return useMutation({
    mutationFn: async (childId: string): Promise<PairingCode> => {
      const { data, error } = await supabase.rpc('create_pairing_code', { p_child_id: childId });
      const created = data?.[0];
      if (error || !created) throw error ?? new Error('create_pairing_code returned nothing');
      return { code: created.code, expiresAt: new Date(created.expires_at) };
    },
  });
}

const devicePlatform: Enums<'device_platform'> =
  Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';

/** Gives this device an anonymous session if needed, then links it to the code's child. */
export function useRedeemPairingCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const { data: current } = await supabase.auth.getSession();
      if (!current.session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
      }

      const { data, error } = await supabase.rpc('redeem_pairing_code', {
        p_code: code,
        p_platform: devicePlatform,
      });
      const child = data?.[0];
      if (error || !child) throw error ?? new Error('redeem_pairing_code returned nothing');
      return { childId: child.child_id, displayName: child.display_name };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['children'] }),
  });
}
