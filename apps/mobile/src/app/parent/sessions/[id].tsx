import { Screen } from '@math-genius/ui';
import { useLocalSearchParams } from 'expo-router';

import { ErrorMessage } from '@/components/error-message';
import { LoadingScreen } from '@/components/loading-screen';
import { errorKind } from '@/data/errors';
import { useSessionDetail } from '@/data/family-sessions';
import { attemptViews } from '@/data/session-report';
import { SessionDetail } from '@/screens/session-detail';

export default function SessionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useSessionDetail(id);

  if (detail.isPending) return <LoadingScreen />;
  if (detail.error) {
    return (
      <Screen>
        <ErrorMessage kind={errorKind(detail.error)} />
      </Screen>
    );
  }

  return (
    <SessionDetail session={detail.data.session} attempts={attemptViews(detail.data.attempts)} />
  );
}
