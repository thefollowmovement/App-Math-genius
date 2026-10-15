import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useChild } from '@/data/children';
import { usePracticeStore } from '@/data/practice/practice-store';
import { summarize } from '@/data/practice/summary';
import { useStartSession } from '@/hooks/use-start-session';
import { SessionSummary } from '@/screens/session-summary';

export default function SummaryRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const session = usePracticeStore((state) => state.children[id]?.lastCompleted ?? null);
  const saved = usePracticeStore(
    (state) => !state.children[id]?.outbox.some((pending) => pending.id === session?.id),
  );
  const start = useStartSession(child.data);
  const home = { pathname: '/child/home', params: { id } } as const;

  if (!session) return <Redirect href={home} />;

  return (
    <SessionSummary
      summary={summarize(session)}
      saved={saved}
      onBonus={() => start('replace')}
      onHome={() => router.replace(home)}
    />
  );
}
