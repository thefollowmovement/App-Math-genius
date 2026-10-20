import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild, type Child } from '@/data/children';
import { openSession, usePracticeStore } from '@/data/practice/practice-store';
import { usePlacementSession } from '@/hooks/use-placement-session';
import { PlacementScreen } from '@/screens/placement';
import { PlacementIntro } from '@/screens/placement/placement-intro';

export default function PlacementRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);

  if (child.isPending) return <LoadingScreen />;
  if (!child.data) return <Redirect href="/child" />;
  return <Placement child={child.data} />;
}

/** The test's intro, then its questions; a test under way resumes where it stopped. */
function Placement({ child }: { child: Child }) {
  const router = useRouter();
  const recheck = usePracticeStore((state) => Boolean(state.children[child.id]?.placedAt));
  const home = { pathname: '/child/home', params: { id: child.id } } as const;
  const test = usePlacementSession(child.id, () =>
    router.replace({ pathname: '/child/placement-result', params: { id: child.id } }),
  );

  if (test.finished) return null;
  if (!test.session || !test.exercise) {
    return (
      <PlacementIntro
        childName={child.display_name}
        recheck={recheck}
        onStart={() =>
          openSession({
            childId: child.id,
            grade: child.grade,
            now: new Date(),
            id: Crypto.randomUUID(),
            seed: Math.floor(Math.random() * 2 ** 31),
            placement: true,
          })
        }
        onLater={() => router.replace(home)}
      />
    );
  }
  return (
    <PlacementScreen
      exercise={test.exercise}
      progress={test.progress}
      recheck={recheck}
      notice={test.notice}
      onSubmit={test.submit}
      onSkip={test.skip}
      onPause={() => router.replace(home)}
    />
  );
}
