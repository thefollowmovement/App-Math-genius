import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { errorKind } from '@/data/errors';
import { answersOf, questionsFor } from '@/data/universe-model';
import {
  useChildInterests,
  useSaveInterests,
  useSkipUniverse,
  useUniverseCatalogue,
} from '@/data/universe';
import { useStartSession } from '@/hooks/use-start-session';
import { UniverseQuestionnaire } from '@/screens/universe';

/** Where the child goes next: the first mission, the map, back to « Mon héros », or home. */
type Then = 'play' | 'map' | 'back' | 'home';

export default function UniverseRoute() {
  const router = useRouter();
  const {
    id,
    mode,
    then = 'home',
  } = useLocalSearchParams<{
    id: string;
    mode?: 'edit';
    then?: Then;
  }>();
  const child = useChild(id);
  const consent = Boolean(child.data?.personalization_consent_at);
  const catalogue = useUniverseCatalogue(consent);
  const interests = useChildInterests(id, consent);
  const save = useSaveInterests(id);
  const skip = useSkipUniverse(id);
  const start = useStartSession(child.data);
  const home = { pathname: '/child/home', params: { id } } as const;

  if (child.isPending) return <LoadingScreen />;
  if (!child.data) return <Redirect href="/child" />;
  // Asked only once the parent agreed; without the catalogue (offline), it waits for next time.
  if (!consent || (catalogue.isError && !catalogue.data)) return <Redirect href={home} />;
  if (!catalogue.data || interests.isPending) return <LoadingScreen />;

  const leave = () => {
    if (then === 'play') start('replace');
    else if (then === 'map') router.replace({ pathname: '/child/map', params: { id } });
    else if (then === 'back' && router.canGoBack()) router.back();
    else router.replace(home);
  };
  const questions = questionsFor(catalogue.data, child.data.grade);

  return (
    <UniverseQuestionnaire
      childName={child.data.display_name}
      mode={mode === 'edit' ? 'edit' : child.data.universe_asked_at ? 'again' : 'first'}
      questions={questions}
      initial={answersOf(interests.data)}
      saving={save.isPending}
      saved={save.isSuccess}
      error={save.error ? errorKind(save.error) : null}
      onSave={(answers) => save.mutate({ questions, answers })}
      onLater={() => {
        // Editing leaves things as they were; otherwise it is asked again in 3 months.
        if (mode !== 'edit') skip.mutate();
        leave();
      }}
      onContinue={leave}
    />
  );
}
