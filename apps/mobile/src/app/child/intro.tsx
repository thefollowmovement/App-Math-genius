import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild, type Child } from '@/data/children';
import { markIntroSeen } from '@/data/practice/practice-store';
import { useHeroIntro } from '@/hooks/use-hero-intro';
import { HeroIntro } from '@/screens/hero-intro';

export default function IntroRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);

  if (child.isPending) return <LoadingScreen />;
  if (!child.data) return <Redirect href="/child" />;
  return <Intro child={child.data} />;
}

function Intro({ child }: { child: Child }) {
  const router = useRouter();
  const intro = useHeroIntro(child);
  const home = { pathname: '/child/home', params: { id: child.id } } as const;
  const done = () => {
    markIntroSeen(child.id);
    router.replace(home);
  };

  return (
    <HeroIntro
      childName={child.display_name}
      step={intro.step}
      hero={intro.hero}
      saving={intro.saving}
      error={intro.error}
      onPickHero={intro.pickHero}
      onConfirmHero={intro.confirmHero}
      onNext={intro.next}
      onStart={done}
      onCustomize={() => {
        done();
        router.push({ pathname: '/child/look', params: { id: child.id } });
      }}
    />
  );
}
