import { DEFAULT_SESSION_GOAL, worldMap } from '@math-genius/exercise-engine';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { useIsOnline } from '@/data/network';
import { currentStop } from '@/data/mission-model';
import { placementOffer } from '@/data/placement-model';
import { useChildHighlights } from '@/data/progress';
import { highlightsKey } from '@/data/progress-model';
import {
  currentMastery,
  hasUnsentAnswers,
  markRecapSeen,
  usePracticeStore,
} from '@/data/practice/practice-store';
import { practiceStatus } from '@/data/practice/summary';
import { usePracticeSync } from '@/data/practice/sync';
import { useParentRewards } from '@/data/parent-rewards';
import { nextReward, rewardViews, standing } from '@/data/parent-rewards-model';
import { useIslands, useRewards, useWeeklyChallenge } from '@/data/rewards';
import { childPlan, routineOf } from '@/data/routine-plan';
import { useRoutines } from '@/data/routines';
import { useAccountKind } from '@/data/session';
import { superPower } from '@/data/learner-profile-model';
import { useLearnerProfile } from '@/data/universe';
import { universeOffer } from '@/data/universe-model';
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
  const introSeen = usePracticeStore((state) => state.introSeen[id] === true);
  const recapSeen = usePracticeStore((state) => state.recapsSeen[id]);
  const online = useIsOnline();
  const start = useStartSession(child.data);
  const routines = useRoutines();
  const rewards = useRewards(child.data?.id);
  const challenge = useWeeklyChallenge(child.data?.id);
  const parentRewards = useParentRewards(child.data?.id);
  const islands = useIslands(child.data?.id);
  const consent = Boolean(child.data?.personalization_consent_at);
  const profile = useLearnerProfile(child.data?.id, consent);
  const highlights = useChildHighlights(child.data?.id);
  const { date } = useLocalClock();
  usePracticeSync(child.data?.id);

  if (child.isPending) return <LoadingScreen />;
  if (!child.data) return <Redirect href="/child" />;
  // The first time on this device, the child chooses a hero, who presents the app.
  if (!introSeen) return <Redirect href={{ pathname: '/child/intro', params: { id } }} />;

  const profileCount = child.allProfiles.length;
  const card = highlights.data ?? null;
  const showCard = card !== null && highlightsKey(card) !== recapSeen;

  return (
    <ChildHome
      child={child.data}
      practice={practiceStatus(practice, child.data.grade, date)}
      plan={childPlan(routines.data, id, date)}
      goal={routineOf(routines.data, id)?.goal ?? DEFAULT_SESSION_GOAL}
      stop={currentStop(
        worldMap({
          grade: child.data.grade,
          mastery: practice ? currentMastery(practice) : {},
          at: new Date().toISOString(),
          defeated: islands.data ?? [],
          placed: Boolean(practice?.placedAt),
        }),
      )}
      placement={placementOffer(practice, child.data.grade, date, new Date())}
      onStartPlacement={() => router.push({ pathname: '/child/placement', params: { id } })}
      universe={universeOffer(child.data, new Date())}
      onOpenUniverse={() => router.push({ pathname: '/child/universe', params: { id } })}
      superPower={consent ? superPower(profile.data?.profile) : null}
      highlights={showCard ? card : null}
      onCloseHighlights={card ? () => markRecapSeen(id, highlightsKey(card)) : undefined}
      rewards={rewards.data}
      challenge={challenge.data}
      nextReward={nextReward(
        rewardViews(
          parentRewards.data ?? [],
          standing(rewards.data?.progress, islands.data?.length ?? 0),
        ),
      )}
      onOpenChest={(chest) => router.push({ pathname: '/child/chest', params: { id, chest } })}
      onOpenBadges={() => router.push({ pathname: '/child/badges', params: { id } })}
      onOpenMap={() => router.push({ pathname: '/child/map', params: { id } })}
      onOpenShop={() => router.push({ pathname: '/child/shop', params: { id } })}
      onOpenLook={() => router.push({ pathname: '/child/look', params: { id } })}
      sync={!online ? 'offline' : unsent ? 'syncing' : 'idle'}
      onStart={() => start()}
      onSwitchProfile={
        kind === 'parent' || profileCount > 1 ? () => router.replace('/child/profiles') : undefined
      }
    />
  );
}
