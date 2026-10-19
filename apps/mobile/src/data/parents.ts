import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { useAccountKind, useUserId } from './session';

export function useParentProfile() {
  const userId = useUserId();
  const isParent = useAccountKind() === 'parent';

  return useQuery({
    queryKey: ['parent', userId],
    enabled: isParent && userId !== undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parents')
        .select('display_name')
        .eq('user_id', userId ?? '')
        .single();
      if (error) throw error;
      return { displayName: data.display_name };
    },
  });
}
