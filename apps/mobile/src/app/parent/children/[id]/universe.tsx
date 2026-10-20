import { useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { errorKind } from '@/data/errors';
import { useChildInterests, useSaveInterests, useUniverseCatalogue } from '@/data/universe';
import { answersOf, questionsFor } from '@/data/universe-model';
import { UniverseQuestionnaire } from '@/screens/universe';

/** The parent changes the child's answers to « Ton univers » (docs/specs.md). */
export default function ParentUniverseRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const consent = Boolean(child.data?.personalization_consent_at);
  const catalogue = useUniverseCatalogue(consent);
  const interests = useChildInterests(id, consent);
  const save = useSaveInterests(id);
  const back = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/parent/children/[id]', params: { id } });

  if (!child.data || !catalogue.data || interests.isPending) return <LoadingScreen />;
  const questions = questionsFor(catalogue.data, child.data.grade);

  return (
    <UniverseQuestionnaire
      childName={child.data.display_name}
      mode="edit"
      questions={questions}
      initial={answersOf(interests.data)}
      saving={save.isPending}
      saved={false}
      error={save.error ? errorKind(save.error) : null}
      onSave={(answers) => save.mutate({ questions, answers }, { onSuccess: back })}
      onLater={back}
      onContinue={back}
    />
  );
}
