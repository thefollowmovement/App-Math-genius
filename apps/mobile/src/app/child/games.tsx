import { useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { useGameRoom } from '@/data/games';
import { gameCompanion, gameRoomView } from '@/data/games-model';
import { lookOf } from '@/data/look-model';
import { usePracticeStore } from '@/data/practice/practice-store';
import { GameRoom } from '@/screens/game-room';
import { localDate } from '@/utils/local-date';

export default function GamesRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const child = useChild(id);
  const room = useGameRoom(id);
  const local = usePracticeStore((state) => state.children[id]?.games);

  if (!child.data) return <LoadingScreen />;
  const view = gameRoomView({
    server: room.data,
    local,
    today: localDate(),
    limitMinutes: child.data.game_minutes_limit,
  });
  return (
    <GameRoom
      view={view}
      companion={gameCompanion(lookOf(child.data).avatar)}
      onPlay={(game) => router.push({ pathname: '/child/game', params: { id, game } })}
    />
  );
}
