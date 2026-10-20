import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { costsOf, type AiSettingsRow, type AiSettingsUpdate } from '@/models/ai-settings';

export function useAiSettings() {
  return useQuery({
    queryKey: ['ai-settings'],
    queryFn: async (): Promise<AiSettingsRow> => {
      const { data, error } = await supabase.from('ai_settings').select('*').eq('id', 1).single();
      if (error) throw error;
      return data;
    },
  });
}

/** Only the super-admin may: RLS refuses everyone else (no row is changed). */
export function useUpdateAiSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (fields: AiSettingsUpdate) => {
      const { data, error } = await supabase
        .from('ai_settings')
        .update(fields)
        .eq('id', 1)
        .select('id');
      if (error) throw error;
      if (data.length === 0) throw new Error('admin_only');
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['ai-settings'] }),
  });
}

export function useAiCosts(days: number) {
  return useQuery({
    queryKey: ['ai-costs', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_ai_costs', { p_days: days });
      if (error) throw error;
      return costsOf(data);
    },
  });
}
