import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { gameList, type MiniGame } from '@/models/games';

/** The mini-games, on or off, in the game room's order. */
export function useMiniGames() {
  return useQuery({
    queryKey: ['mini-games'],
    queryFn: async (): Promise<MiniGame[]> => {
      const { data, error } = await supabase.from('mini_games').select('*').order('position');
      if (error) throw error;
      return gameList(data);
    },
  });
}

/** Turns games on or off, or moves them (editors and super-admins: RLS). */
export function useUpdateMiniGames() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (
      changes: { id: string; fields: { enabled?: boolean; position?: number } }[],
    ) => {
      for (const { id, fields } of changes) {
        const { error } = await supabase.from('mini_games').update(fields).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['mini-games'] }),
  });
}
