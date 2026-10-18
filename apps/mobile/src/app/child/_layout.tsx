import { Stack } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChildren } from '@/data/children';
import { usePracticeHydrated } from '@/data/practice/practice-store';
import { usePushRegistration } from '@/data/push';
import { useAccountKind, useSessionStore } from '@/data/session';
import { useStackScreenOptions } from '@/hooks/use-stack-screen-options';

export default function ChildLayout() {
  const ready = useSessionStore((state) => state.ready);
  // Sessions are saved on the device: wait for them before anything can start a new one.
  const hydrated = usePracticeHydrated();
  const screenOptions = useStackScreenOptions();
  const kind = useAccountKind();
  const paired = (useChildren().data?.length ?? 0) > 0;
  // Reminders reach the child's device, app closed; once paired, it also tells the parent whether
  // it can show them. A parent in child mode keeps their own alerts.
  usePushRegistration(kind === 'device' && paired ? 'device' : null);

  if (!ready || !hydrated) return <LoadingScreen />;

  return (
    <Stack screenOptions={{ ...screenOptions, title: '' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="practice" options={{ headerShown: false }} />
      <Stack.Screen name="summary" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="chest" options={{ headerShown: false, presentation: 'modal' }} />
      {/* These screens show their own title. */}
      <Stack.Screen name="badges" />
      <Stack.Screen name="map" />
    </Stack>
  );
}
