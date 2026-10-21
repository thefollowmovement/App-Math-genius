import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { parseGameRoom, type GameRoomData } from './games-model';

/**
 * The game room from the server: games turned on by the team, the child's records and stars,
 * today's playing time and gems from the games. Kept on the device, to play offline.
 */
export function useGameRoom(childId: string | undefined) {
  return useQuery({
    queryKey: ['game-room', childId],
    enabled: childId !== undefined,
    // Opening the room asks the server again: a game turned off, a new limit apply at once.
    refetchOnMount: 'always',
    queryFn: async (): Promise<GameRoomData | null> => {
      const { data, error } = await supabase.rpc('game_room', { p_child_id: childId ?? '' });
      if (error) throw error;
      return parseGameRoom(data);
    },
  });
}

/** The parent sets how long the child may play each day (RLS: their own children only). */
export function useSetGameLimit(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (minutes: number) => {
      const { error } = await supabase
        .from('children')
        .update({ game_minutes_limit: minutes })
        .eq('id', childId);
      if (error) throw error;
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['children'] }),
        queryClient.invalidateQueries({ queryKey: ['game-room', childId] }),
      ]),
  });
}
