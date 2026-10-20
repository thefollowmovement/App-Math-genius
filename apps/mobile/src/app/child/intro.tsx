import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild, type Child } from '@/data/children';
import { placementOffer } from '@/data/placement-model';
import { markIntroSeen, usePracticeStore } from '@/data/practice/practice-store';
import { localDate } from '@/utils/local-date';
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
  const practice = usePracticeStore((state) => state.children[child.id]);
  const home = { pathname: '/child/home', params: { id: child.id } } as const;
  const done = () => {
    markIntroSeen(child.id);
    router.replace(home);
  };
  // Then the « aventure de départ » (docs/specs.md, onboarding), unless taken on another device.
  const now = new Date();
  const firstTest = placementOffer(practice, child.grade, localDate(now), now) === 'first';

  return (
    <HeroIntro
      childName={child.display_name}
      step={intro.step}
      hero={intro.hero}
      outfit={intro.outfit}
      saving={intro.saving}
      error={intro.error}
      onPickHero={intro.pickHero}
      onConfirmHero={intro.confirmHero}
      onNext={intro.next}
      onStart={() => {
        if (!firstTest) return done();
        markIntroSeen(child.id);
        router.replace({ pathname: '/child/placement', params: { id: child.id } });
      }}
      onCustomize={() => {
        done();
        router.push({ pathname: '/child/look', params: { id: child.id } });
      }}
    />
  );
}
