import { useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useSignOut } from '@/data/auth';
import { useChildren } from '@/data/children';
import { useParentProfile } from '@/data/parents';
import { ParentHome } from '@/screens/parent-home';

export default function ParentHomeRoute() {
  const router = useRouter();
  const children = useChildren();
  const parent = useParentProfile();
  const signOut = useSignOut();

  if (children.isPending) return <LoadingScreen />;

  return (
    <ParentHome
      parentName={parent.data?.displayName}
      childProfiles={children.data ?? []}
      onAddChild={() => router.push('/parent/children/new')}
      onOpenChild={(id) => router.push({ pathname: '/parent/children/[id]', params: { id } })}
      onChildMode={() => router.push('/child/profiles')}
      onSignOut={() => signOut.mutate()}
    />
  );
}
