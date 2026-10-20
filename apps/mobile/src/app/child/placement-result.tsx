import { worldMap } from '@math-genius/exercise-engine';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { currentStop } from '@/data/mission-model';
import { currentMastery, usePracticeStore } from '@/data/practice/practice-store';
import { useIslands } from '@/data/rewards';
import { universeOffer } from '@/data/universe-model';
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
  // « Ton univers » comes right after the test (docs/specs.md), once the parent agreed.
  const universe = universeOffer(child.data, new Date());
  const thenUniverse = (then: 'play' | 'map' | 'home') =>
    router.replace({ pathname: '/child/universe', params: { id, then } });
  return (
    <PlacementResult
      islands={map}
      stop={currentStop(map)}
      onPlay={() => (universe ? thenUniverse('play') : start('replace'))}
      onOpenMap={() =>
        universe ? thenUniverse('map') : router.push({ pathname: '/child/map', params: { id } })
      }
      onHome={() => (universe ? thenUniverse('home') : router.replace(home))}
    />
  );
}
