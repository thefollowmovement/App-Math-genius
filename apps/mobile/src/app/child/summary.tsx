import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useChild } from '@/data/children';
import { creditOfDay, usePracticeStore } from '@/data/practice/practice-store';
import { summarize } from '@/data/practice/summary';
import { useRewards, useSessionAward } from '@/data/rewards';
import { awardState, wornEffect } from '@/data/rewards-model';
import { useStartSession } from '@/hooks/use-start-session';
import { SessionSummary } from '@/screens/session-summary';

export default function SummaryRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const session = usePracticeStore((state) => state.children[id]?.lastCompleted ?? null);
  const gameDay = usePracticeStore((state) => state.children[id]?.games?.day ?? null);
  const saved = usePracticeStore(
    (state) => !state.children[id]?.outbox.some((pending) => pending.id === session?.id),
  );
  const award = useSessionAward(session?.id, saved);
  const rewards = useRewards(id);
  const start = useStartSession(child.data);
  const home = { pathname: '/child/home', params: { id } } as const;

  if (!session) return <Redirect href={home} />;

  return (
    <SessionSummary
      summary={summarize(session, creditOfDay(gameDay, session))}
      saved={saved}
      award={awardState(saved, award.data)}
      onOpenChest={(chest) => router.push({ pathname: '/child/chest', params: { id, chest } })}
      onOpenBadges={() => router.push({ pathname: '/child/badges', params: { id } })}
      effect={wornEffect(rewards.data?.items ?? [])}
      onBonus={() => start('replace')}
      onHome={() => router.replace(home)}
    />
  );
}
