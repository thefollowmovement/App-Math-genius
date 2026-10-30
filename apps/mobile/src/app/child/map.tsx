import { worldMap } from '@math-genius/exercise-engine';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { currentMastery, usePracticeStore } from '@/data/practice/practice-store';
import { practiceStatus } from '@/data/practice/summary';
import { useIslands } from '@/data/rewards';
import { useLocalClock } from '@/hooks/use-local-clock';
import { useStartSession } from '@/hooks/use-start-session';
import { WorldMap } from '@/screens/world-map';

export default function MapRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const child = useChild(id);
  const practice = usePracticeStore((state) => state.children[id]);
  const islands = useIslands(child.data?.id);
  const { date } = useLocalClock();
  const start = useStartSession(child.data);

  if (child.isPending) return <LoadingScreen />;
  if (!child.data) return <Redirect href="/child" />;

  return (
    <WorldMap
      islands={worldMap({
        grade: child.data.grade,
        mastery: practice ? currentMastery(practice) : {},
        at: new Date().toISOString(),
        defeated: islands.data ?? [],
        placed: Boolean(practice?.placedAt),
      })}
      busy={practiceStatus(practice, child.data.grade, date).status === 'in-progress'}
      onFightBoss={(island) => start('push', island)}
      onOpenGames={() => router.push({ pathname: '/child/games', params: { id } })}
    />
  );
}
