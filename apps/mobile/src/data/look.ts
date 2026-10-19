import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { Look } from './look-model';
import { refetchAfterWrite } from './query-client';

/** The child's theme and avatar (set_child_look checks them, and the badges of rare parts). */
export function useSetChildLook(childId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ theme, avatar }: Look) => {
      const { error } = await supabase.rpc('set_child_look', {
        p_child_id: childId,
        p_theme_id: theme,
        p_avatar: avatar,
      });
      if (error) throw error;
    },
    // The child's screens take the new theme as soon as the profiles come back.
    onSuccess: () => refetchAfterWrite(client, ['children']),
  });
}
