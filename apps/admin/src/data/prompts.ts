import type { Database } from '@math-genius/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type PromptRow = Database['public']['Tables']['ai_prompts']['Row'];

export function usePrompts() {
  return useQuery({
    queryKey: ['prompts'],
    queryFn: async (): Promise<PromptRow[]> => {
      const { data, error } = await supabase
        .from('ai_prompts')
        .select('*')
        .eq('task', 'explain')
        .order('version', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePrompt() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (prompt: {
      version: number;
      grade_band: string | null;
      system: string;
      user_template: string;
      notes: string | null;
      created_by: string;
    }) => {
      const { data, error } = await supabase
        .from('ai_prompts')
        .insert({ task: 'explain', ...prompt })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['prompts'] }),
  });
}

export function useActivatePrompt() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('admin_activate_prompt', { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['prompts'] }),
  });
}

export type PreviewRequest = {
  skill: string;
  error: string | null;
  universe: string | null;
  band: string;
  system: string;
  user: string;
  version: number;
  night: boolean;
};

/** Tries a prompt on an example (the ai-gateway Edge Function, task « preview »). */
export function usePreview() {
  return useMutation({
    mutationFn: async (request: PreviewRequest): Promise<unknown> => {
      const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: { task: 'preview', ...request },
      });
      if (error) throw error;
      return data;
    },
  });
}
