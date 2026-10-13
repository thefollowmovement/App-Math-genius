import type { Tables } from '@math-genius/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type PairedDevice = Pick<Tables<'devices'>, 'id' | 'platform'> & {
  /** When this device was linked to the child. */
  paired_at: string;
};

const POLL_EVERY_MS = 3000;

/**
 * Devices currently paired with a child (revoking a device removes its links).
 * While a pairing code waits to be scanned, pass the device count at its creation: the list
 * refreshes until a new device shows up.
 */
export function useChildDevices(
  childId: string | undefined,
  pollUntilMoreThan: number | null = null,
) {
  return useQuery({
    queryKey: ['devices', childId],
    enabled: childId !== undefined,
    refetchInterval: (query) =>
      pollUntilMoreThan !== null && (query.state.data?.length ?? 0) <= pollUntilMoreThan
        ? POLL_EVERY_MS
        : false,
    queryFn: async (): Promise<PairedDevice[]> => {
      const { data, error } = await supabase
        .from('device_children')
        .select('created_at, device:devices(id, platform)')
        .eq('child_id', childId ?? '')
        .order('created_at');
      if (error) throw error;
      return data.flatMap(({ created_at, device }) =>
        device ? [{ ...device, paired_at: created_at }] : [],
      );
    },
  });
}

export function useRevokeDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deviceId: string) => {
      const { error } = await supabase.rpc('revoke_device', { p_device_id: deviceId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['devices'] }),
  });
}
