import { DEFAULT_SESSION_GOAL } from '@math-genius/exercise-engine';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { useIsOnline } from '@/data/network';
import { hasUnsentAnswers, usePracticeStore } from '@/data/practice/practice-store';
import { practiceStatus } from '@/data/practice/summary';
import { usePracticeSync } from '@/data/practice/sync';
import { useRewards } from '@/data/rewards';
import { childPlan, routineOf } from '@/data/routine-plan';
import { useRoutines } from '@/data/routines';
import { useAccountKind } from '@/data/session';
import { useLocalClock } from '@/hooks/use-local-clock';
import { useStartSession } from '@/hooks/use-start-session';
import { ChildHome } from '@/screens/child-home';

export default function ChildHomeRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const kind = useAccountKind();
  const child = useChild(id);
  const practice = usePracticeStore((state) => state.children[id]);
  const unsent = usePracticeStore((state) => hasUnsentAnswers(state.children[id]));
  const online = useIsOnline();
  const start = useStartSession(child.data);
  const routines = useRoutines();
  const rewards = useRewards(child.data?.id);
  const { date } = useLocalClock();
  usePracticeSync(child.data?.id);

  if (child.isPending) return <LoadingScreen />;
  if (!child.data) return <Redirect href="/child" />;

  const profileCount = child.allProfiles.length;

  return (
    <ChildHome
      child={child.data}
      practice={practiceStatus(practice, child.data.grade, date)}
      plan={childPlan(routines.data, id, date).kind}
      goal={routineOf(routines.data, id)?.goal ?? DEFAULT_SESSION_GOAL}
      rewards={rewards.data}
      onOpenChest={(chest) => router.push({ pathname: '/child/chest', params: { id, chest } })}
      onOpenBadges={() => router.push({ pathname: '/child/badges', params: { id } })}
      onOpenMap={() => router.push({ pathname: '/child/map', params: { id } })}
      onOpenShop={() => router.push({ pathname: '/child/shop', params: { id } })}
      sync={!online ? 'offline' : unsent ? 'syncing' : 'idle'}
      onStart={() => start()}
      onSwitchProfile={
        kind === 'parent' || profileCount > 1 ? () => router.replace('/child/profiles') : undefined
      }
    />
  );
}
