import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { markIntroSeen } from '@/data/practice/practice-store';
import { MascotIntro } from '@/screens/mascot-intro';

export default function IntroRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);

  if (child.isPending) return <LoadingScreen />;
  if (!child.data) return <Redirect href="/child" />;

  const home = { pathname: '/child/home', params: { id } } as const;
  const done = () => {
    markIntroSeen(id);
    router.replace(home);
  };

  return (
    <MascotIntro
      childName={child.data.display_name}
      onMakeAvatar={() => {
        done();
        router.push({ pathname: '/child/look', params: { id } });
      }}
      onLater={done}
    />
  );
}
