import { DEFAULT_LOOKS, type ChildProfile, type Tables } from '@math-genius/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { useUserId } from './session';

export type Child = Pick<
  Tables<'children'>,
  | 'id'
  | 'display_name'
  | 'gender'
  | 'grade'
  | 'birth_year'
  | 'theme_id'
  | 'avatar'
  // Personalization (phase 7b): the parent's consent, and when « Ton univers » was last asked.
  | 'personalization_consent_at'
  | 'universe_asked_at'
  // Minutes of mini-games a day, set by the parent (phase 9b).
  | 'game_minutes_limit'
>;

const CHILD_COLUMNS =
  'id, display_name, gender, grade, birth_year, theme_id, avatar, personalization_consent_at, universe_asked_at, game_minutes_limit';

/** A parent gets their family's children; a paired device gets its own (RLS decides). */
export function useChildren() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['children', userId],
    enabled: userId !== undefined,
    queryFn: async (): Promise<Child[]> => {
      const { data, error } = await supabase
        .from('children')
        .select(CHILD_COLUMNS)
        .order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useChild(childId: string | undefined) {
  const children = useChildren();
  return {
    isPending: children.isPending,
    data: children.data?.find((child) => child.id === childId),
    allProfiles: children.data ?? [],
  };
}

export function useCreateChild() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: ChildProfile): Promise<Child> => {
      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .select('family_id')
        .eq('user_id', userId ?? '')
        .single();
      if (parentError) throw parentError;

      const { data, error } = await supabase
        .from('children')
        .insert({
          family_id: parent.family_id,
          display_name: profile.displayName,
          gender: profile.gender,
          grade: profile.grade,
          birth_year: profile.birthYear,
          // Preselected from the profile; the child changes it at will (docs/specs.md).
          theme_id: DEFAULT_LOOKS[profile.gender].theme,
        })
        .select(CHILD_COLUMNS)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['children'] }),
  });
}
