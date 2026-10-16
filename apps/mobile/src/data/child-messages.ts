import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/** Sends a parent's message to the child's devices; resolves with how many got it. */
export function useSendChildMessage(childId: string) {
  return useMutation({
    mutationFn: async (message: string): Promise<number> => {
      const { data, error } = await supabase.rpc('send_child_message', {
        p_child_id: childId,
        p_message: message,
      });
      if (error) throw error;
      return data;
    },
  });
}
