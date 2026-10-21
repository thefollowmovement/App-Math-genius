import type { Database } from '@math-genius/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

type Tables = Database['public']['Tables'];
export type QuestionRow = Tables['interest_questions']['Row'];
export type OptionRow = Tables['interest_options']['Row'];

/** The questions of « Ton univers », asked or not, in order. */
export function useQuestions() {
  return useQuery({
    queryKey: ['questions'],
    queryFn: async (): Promise<QuestionRow[]> => {
      const { data, error } = await supabase
        .from('interest_questions')
        .select('*')
        .order('position');
      if (error) throw error;
      return data;
    },
  });
}

export function useOptions() {
  return useQuery({
    queryKey: ['options'],
    queryFn: async (): Promise<OptionRow[]> => {
      const { data, error } = await supabase.from('interest_options').select('*').order('position');
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateQuestion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      fields,
    }: {
      id: string;
      fields: Tables['interest_questions']['Update'];
    }) => {
      const { error } = await supabase.from('interest_questions').update(fields).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['questions'] }),
  });
}

/** Adds, moves or removes a choice; the positions are written again in their new order. */
export function useSaveOptions() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      questionId,
      options,
      removed,
    }: {
      questionId: string;
      options: { universe_id: string; icon: string }[];
      removed: string[];
    }) => {
      if (removed.length > 0) {
        const { error } = await supabase
          .from('interest_options')
          .delete()
          .eq('question_id', questionId)
          .in('universe_id', removed);
        if (error) throw error;
      }
      if (options.length > 0) {
        const { error } = await supabase.from('interest_options').upsert(
          options.map((option, index) => ({
            question_id: questionId,
            universe_id: option.universe_id,
            icon: option.icon,
            position: (index + 1) * 10,
          })),
        );
        if (error) throw error;
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['options'] }),
  });
}
