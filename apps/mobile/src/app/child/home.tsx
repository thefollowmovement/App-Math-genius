import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { useAccountKind } from '@/data/session';
import { ChildHome } from '@/screens/child-home';

export default function ChildHomeRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const kind = useAccountKind();
  const child = useChild(id);

  if (child.isPending) return <LoadingScreen />;
  if (!child.data) return <Redirect href="/child" />;

  const profileCount = child.allProfiles.length;

  return (
    <ChildHome
      child={child.data}
      onSwitchProfile={
        kind === 'parent' || profileCount > 1 ? () => router.replace('/child/profiles') : undefined
      }
    />
  );
}
