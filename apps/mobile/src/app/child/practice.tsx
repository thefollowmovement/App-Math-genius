import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useCoach } from '@/hooks/use-coach';
import { usePracticeSession } from '@/hooks/use-practice-session';
import { PracticeScreen } from '@/screens/practice';

export default function PracticeRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const practice = usePracticeSession(id, () =>
    router.replace({ pathname: '/child/summary', params: { id } }),
  );
  const home = { pathname: '/child/home', params: { id } } as const;
  const wrong = practice.feedback && !practice.feedback.correct ? practice.feedback : null;
  const coach = useCoach(id, wrong ? practice.exercise : null, wrong?.response ?? null);

  if (practice.finished) return null;
  if (!practice.session || !practice.step || !practice.exercise || !practice.count) {
    return <Redirect href={home} />;
  }

  return (
    <PracticeScreen
      exercise={practice.exercise}
      slot={practice.step.slot}
      twin={practice.step.twinOf !== null}
      boss={practice.session.boss}
      reminder={practice.step.reminder}
      progress={practice.progress}
      count={practice.count}
      combo={practice.combo}
      hintShown={practice.hintShown}
      notice={practice.notice}
      feedback={practice.feedback}
      coach={coach.view}
      onShowHint={practice.showHint}
      onSubmit={practice.submit}
      onContinue={practice.continueSession}
      onUnderstood={coach.understood}
      onExplainAgain={coach.explainAgain}
      onPause={() => router.replace(home)}
    />
  );
}
