import { useQuery } from '@tanstack/react-query';

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
    queryFn: async (): Promise<GameRoomData | null> => {
      const { data, error } = await supabase.rpc('game_room', { p_child_id: childId ?? '' });
      if (error) throw error;
      return parseGameRoom(data);
    },
  });
}
