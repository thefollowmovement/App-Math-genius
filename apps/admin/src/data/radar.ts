import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { InterestCount, OtherAnswer } from '@/models/radar';

/** Choices per age group and month, never a child (admin_interest_counts). */
export function useInterestCounts(months: number) {
  return useQuery({
    queryKey: ['interest-counts', months],
    queryFn: async (): Promise<InterestCount[]> => {
      const { data, error } = await supabase.rpc('admin_interest_counts', { p_months: months });
      if (error) throw error;
      return data;
    },
  });
}

/** « Autre » answers waiting for a moderator: the text, its question and age group. */
export function useOtherAnswers() {
  return useQuery({
    queryKey: ['other-answers'],
    queryFn: async (): Promise<OtherAnswer[]> => {
      const { data, error } = await supabase.rpc('admin_other_answers', { p_status: 'pending' });
      if (error) throw error;
      return data;
    },
  });
}

export function useReviewOthers() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: 'approved' | 'rejected' }) => {
      for (const id of ids) {
        const { error } = await supabase.rpc('admin_review_other', { p_id: id, p_status: status });
        if (error) throw error;
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['other-answers'] }),
  });
}
