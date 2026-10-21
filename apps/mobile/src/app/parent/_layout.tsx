import { Stack } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useLiveSessions } from '@/data/family-sessions';
import { usePushRegistration } from '@/data/push';
import { useAccountKind, useSessionStore } from '@/data/session';
import { useStackScreenOptions } from '@/hooks/use-stack-screen-options';
import { strings } from '@/i18n';

export default function ParentLayout() {
  const ready = useSessionStore((state) => state.ready);
  const isParent = useAccountKind() === 'parent';
  const screenOptions = useStackScreenOptions();
  // One Realtime subscription for every parent screen: sessions update as children play.
  useLiveSessions(isParent);
  // Alerts (session not started, missed, finished) reach the parent's phone.
  usePushRegistration(isParent ? 'parent' : null);

  if (!ready) return <LoadingScreen />;

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Protected guard={isParent}>
        <Stack.Screen
          name="index"
          // Signed in, going back would only reach the welcome screen, which comes straight back.
          options={{
            title: strings.parentHome.title,
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="children/new" options={{ title: strings.childForm.title }} />
        <Stack.Screen name="children/[id]/index" />
        <Stack.Screen name="children/[id]/routine" options={{ title: strings.routine.title }} />
        <Stack.Screen name="children/[id]/progress" options={{ title: strings.progress.title }} />
        {/* The questionnaire shows its own buttons to leave. */}
        <Stack.Screen name="children/[id]/universe" options={{ headerShown: false }} />
        <Stack.Screen name="sessions/[id]" options={{ title: strings.sessionDetail.title }} />
        <Stack.Screen name="recaps" options={{ title: strings.recapSettings.title }} />
      </Stack.Protected>
      <Stack.Protected guard={!isParent}>
        <Stack.Screen name="sign-in" options={{ title: strings.signIn.title }} />
        <Stack.Screen name="sign-up" options={{ title: strings.signUp.title }} />
      </Stack.Protected>
    </Stack>
  );
}
