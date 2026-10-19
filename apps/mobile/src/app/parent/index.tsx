import { useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useSignOut } from '@/data/auth';
import { useChildren } from '@/data/children';
import { useTodaySessions } from '@/data/family-sessions';
import { useParentProfile } from '@/data/parents';
import { childPlan } from '@/data/routine-plan';
import { useRoutines } from '@/data/routines';
import { familyDay } from '@/data/session-report';
import { useLocalClock } from '@/hooks/use-local-clock';
import { ParentHome } from '@/screens/parent-home';

export default function ParentHomeRoute() {
  const router = useRouter();
  const children = useChildren();
  const parent = useParentProfile();
  const signOut = useSignOut();
  const sessions = useTodaySessions();
  const routines = useRoutines();
  // Ticks every few seconds: a deadline passing turns the day into "missed" without a reload.
  const clock = useLocalClock();

  if (children.isPending) return <LoadingScreen />;

  const childProfiles = children.data ?? [];
  const today =
    sessions.data && !routines.isPending
      ? familyDay(
          childProfiles.map((child) => child.id),
          sessions.data,
          (childId) => childPlan(routines.data, childId, clock.date),
          clock.minute,
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
