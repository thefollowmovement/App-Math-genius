import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { usePracticeSession } from '@/hooks/use-practice-session';
import { PracticeScreen } from '@/screens/practice';

export default function PracticeRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const practice = usePracticeSession(id, () =>
    router.replace({ pathname: '/child/summary', params: { id } }),
  );
  const home = { pathname: '/child/home', params: { id } } as const;

  if (practice.finished) return null;
  if (!practice.session || !practice.step || !practice.exercise) return <Redirect href={home} />;

  return (
    <PracticeScreen
      exercise={practice.exercise}
      slot={practice.step.slot}
      twin={practice.step.twinOf !== null}
      reminder={practice.step.reminder}
      progress={practice.progress}
      hintShown={practice.hintShown}
      notice={practice.notice}
      feedback={practice.feedback}
      onShowHint={practice.showHint}
      onSubmit={practice.submit}
      onContinue={practice.continueSession}
      onPause={() => router.replace(home)}
    />
  );
}
