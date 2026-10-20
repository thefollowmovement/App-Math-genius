import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { UniverseInsert, UniverseRow } from '@/models/universes';

const KEY = ['universes'];

/** Every reference, retired ones included (admins read them all). */
export function useUniverses() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<UniverseRow[]> => {
      const { data, error } = await supabase.from('universes').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });
}

/** Adds a reference, or changes one (its id never changes). */
export function useSaveUniverse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ record, isNew }: { record: UniverseInsert; isNew: boolean }) => {
      const { id, ...fields } = record;
      const { error } = isNew
        ? await supabase.from('universes').insert(record)
        : await supabase.from('universes').update(fields).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateUniverse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Partial<UniverseInsert> }) => {
      const { error } = await supabase.from('universes').update(fields).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
  });
}
