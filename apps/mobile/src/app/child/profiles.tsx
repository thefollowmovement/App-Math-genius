import { Redirect, Stack, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChildren } from '@/data/children';
import { useAccountKind } from '@/data/session';
import { ProfilePicker } from '@/screens/profile-picker';

export default function ProfilesRoute() {
  const router = useRouter();
  const kind = useAccountKind();
  const children = useChildren();

  if (!kind) return <Redirect href="/child/pair" />;
  if (children.isPending) return <LoadingScreen />;

  return (
    <>
      {/* On a child device there is nothing to go back to; a parent returns to their space. */}
      <Stack.Screen
        options={{ headerBackVisible: kind === 'parent', gestureEnabled: kind === 'parent' }}
      />
      <ProfilePicker
        childProfiles={children.data ?? []}
        onPick={(id) => router.push({ pathname: '/child/home', params: { id } })}
        onPairAnother={kind === 'device' ? () => router.push('/child/pair') : undefined}
      />
    </>
  );
}
