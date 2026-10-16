import { Stack } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
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
  // Reminders reach the child's device, app closed. A parent in child mode keeps their own alerts.
  usePushRegistration(kind === 'device');

  if (!ready || !hydrated) return <LoadingScreen />;

  return (
    <Stack screenOptions={{ ...screenOptions, title: '' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="practice" options={{ headerShown: false }} />
      <Stack.Screen name="summary" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
}
