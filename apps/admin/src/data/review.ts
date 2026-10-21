import type { Database } from '@math-genius/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

type Public = Database['public'];
export type ExplanationRow = Public['Tables']['explanations']['Row'];
export type ExplanationStatus = Public['Enums']['explanation_status'];
export type ModerationEntry = Public['Functions']['admin_moderation_log']['Returns'][number];

export function useExplanations(status: ExplanationStatus) {
  return useQuery({
    queryKey: ['explanations', status],
    queryFn: async (): Promise<ExplanationRow[]> => {
      const { data, error } = await supabase
        .from('explanations')
        .select('*')
        .eq('status', status)
        // The oldest waiting first; the others, the latest first.
        .order('created_at', { ascending: status === 'pending' })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}

export function useReviewExplanation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ExplanationStatus }) => {
      const { error } = await supabase.rpc('admin_review_explanation', {
        p_id: id,
        p_status: status,
      });
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['explanations'] }),
  });
}

export function useBannedWords() {
  return useQuery({
    queryKey: ['banned-words'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from('ai_banned_words').select('word').order('word');
      if (error) throw error;
      return data.map((row) => row.word);
    },
  });
}

export function useBannedWord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ word, add }: { word: string; add: boolean }) => {
      const { error } = add
        ? await supabase.from('ai_banned_words').insert({ word })
        : await supabase.from('ai_banned_words').delete().eq('word', word);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['banned-words'] }),
  });
}

export function useModerationLog() {
  return useQuery({
    queryKey: ['moderation-log'],
    queryFn: async (): Promise<ModerationEntry[]> => {
      const { data, error } = await supabase.rpc('admin_moderation_log', { p_limit: 200 });
      if (error) throw error;
      return data;
    },
  });
}
