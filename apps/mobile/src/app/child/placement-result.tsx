import { worldMap } from '@math-genius/exercise-engine';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { currentStop } from '@/data/mission-model';
import { currentMastery, usePracticeStore } from '@/data/practice/practice-store';
import { useIslands } from '@/data/rewards';
import { useStartSession } from '@/hooks/use-start-session';
import { PlacementResult } from '@/screens/placement/placement-result';

export default function PlacementResultRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const practice = usePracticeStore((state) => state.children[id]);
  const islands = useIslands(child.data?.id);
  const start = useStartSession(child.data);
  const home = { pathname: '/child/home', params: { id } } as const;

  if (child.isPending) return <LoadingScreen />;
  if (!child.data) return <Redirect href="/child" />;

  const map = worldMap({
    grade: child.data.grade,
    mastery: practice ? currentMastery(practice) : {},
    at: new Date().toISOString(),
    defeated: islands.data ?? [],
    placed: Boolean(practice?.placedAt),
  });
  return (
    <PlacementResult
      islands={map}
      stop={currentStop(map)}
      onPlay={() => start('replace')}
      onOpenMap={() => router.push({ pathname: '/child/map', params: { id } })}
      onHome={() => router.replace(home)}
    />
  );
}
