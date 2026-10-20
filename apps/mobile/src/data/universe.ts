import { PERSONALIZATION_CONSENT_VERSION } from '@math-genius/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { parseProfile } from './learner-profile-model';
import { refetchAfterWrite } from './query-client';
import type { Answers, Catalogue, Interests, UniverseQuestion } from './universe-model';
import { answersPayload } from './universe-model';

/**
 * « Ton univers » and the learning profile (supabase/migrations/*_personalization.sql): the
 * catalogue, the child's answers, the profile the server computed, and the parent's consent.
 */

/** Questions, choices and universes in use; kept on the device with the profiles. */
export function useUniverseCatalogue(enabled = true) {
  return useQuery({
    queryKey: ['universes'],
    enabled,
    staleTime: 60 * 60_000,
    queryFn: async (): Promise<Catalogue> => {
      const [questions, options, universes] = await Promise.all([
        supabase.from('interest_questions').select('id, title, grades, position, other_grades'),
        supabase.from('interest_options').select('question_id, universe_id, icon, position'),
        supabase.from('universes').select('id, name, grades, status'),
      ]);
      if (questions.error) throw questions.error;
      if (options.error) throw options.error;
      if (universes.error) throw universes.error;
      return { questions: questions.data, options: options.data, universes: universes.data };
    },
  });
}

export function useChildInterests(childId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['interests', childId],
    enabled: enabled && childId !== undefined,
    queryFn: async (): Promise<Interests> => {
      const [chosen, others] = await Promise.all([
        supabase
          .from('child_interests')
          .select('universe_id, question_id, source')
          .eq('child_id', childId ?? ''),
        supabase
          .from('interest_other_answers')
          .select('question_id, answer, status')
          .eq('child_id', childId ?? ''),
      ]);
      if (chosen.error) throw chosen.error;
      if (others.error) throw others.error;
      return { chosen: chosen.data, others: others.data };
    },
  });
}

/** Saves the answers to every question shown (from the child's device or by the parent). */
export function useSaveInterests(childId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { questions: readonly UniverseQuestion[]; answers: Answers }) => {
      const { error } = await supabase.rpc('set_child_interests', {
        p_child_id: childId ?? '',
        p_answers: answersPayload(input.questions, input.answers),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        refetchAfterWrite(queryClient, ['interests', childId]),
        // The date it was asked, on the child.
        refetchAfterWrite(queryClient, ['children']),
      ]);
    },
  });
}

/** « Plus tard »: asked again in 3 months, or at the next school year. */
export function useSkipUniverse(childId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('skip_universe', { p_child_id: childId ?? '' });
      if (error) throw error;
    },
    onSuccess: () => refetchAfterWrite(queryClient, ['children']),
  });
}

/** The learning profile the server computed; null before the first one, or without consent. */
export function useLearnerProfile(childId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['learner-profile', childId],
    enabled: enabled && childId !== undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learner_profiles')
        .select('profile, summary, computed_at')
        .eq('child_id', childId ?? '')
        .maybeSingle();
      if (error) throw error;
      return data ? { profile: parseProfile(data.profile), computedAt: data.computed_at } : null;
    },
  });
}

/** The parent turns personalization on (having read the text of this version) or off. */
export function useSetPersonalization(childId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase.rpc('set_personalization', {
        p_child_id: childId ?? '',
        p_enabled: enabled,
        p_version: PERSONALIZATION_CONSENT_VERSION,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        refetchAfterWrite(queryClient, ['children']),
        refetchAfterWrite(queryClient, ['interests', childId]),
        refetchAfterWrite(queryClient, ['learner-profile', childId]),
      ]);
    },
  });
}
