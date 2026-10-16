import { useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useSignOut } from '@/data/auth';
import { useChildren } from '@/data/children';
import { useTodaySessions } from '@/data/family-sessions';
import { useParentProfile } from '@/data/parents';
import { familyDay } from '@/data/session-report';
import { ParentHome } from '@/screens/parent-home';

export default function ParentHomeRoute() {
  const router = useRouter();
  const children = useChildren();
  const parent = useParentProfile();
  const signOut = useSignOut();
  const sessions = useTodaySessions();

  if (children.isPending) return <LoadingScreen />;

  const childProfiles = children.data ?? [];
  const today = sessions.data
    ? familyDay(
        childProfiles.map((child) => child.id),
        sessions.data,
      )
    : {};

  return (
    <ParentHome
      parentName={parent.data?.displayName}
      childProfiles={childProfiles}
      today={today}
      onAddChild={() => router.push('/parent/children/new')}
      onOpenChild={(id) => router.push({ pathname: '/parent/children/[id]', params: { id } })}
      onChildMode={() => router.push('/child/profiles')}
      onSignOut={() => signOut.mutate()}
    />
  );
}
