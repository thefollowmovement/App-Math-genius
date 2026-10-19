import { Redirect, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useAccountKind, useSessionStore } from '@/data/session';
import { Welcome } from '@/screens/welcome';

export default function WelcomeRoute() {
  const router = useRouter();
  const ready = useSessionStore((state) => state.ready);
  const kind = useAccountKind();

  if (!ready) return <LoadingScreen />;
  if (kind === 'parent') return <Redirect href="/parent" />;
  if (kind === 'device') return <Redirect href="/child" />;

  return (
    <Welcome
      onChooseParent={() => router.push('/parent')}
      onChooseChild={() => router.push('/child')}
    />
  );
}
