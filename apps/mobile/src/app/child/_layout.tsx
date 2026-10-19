import { Stack } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { usePracticeHydrated } from '@/data/practice/practice-store';
import { useSessionStore } from '@/data/session';
import { useStackScreenOptions } from '@/hooks/use-stack-screen-options';

export default function ChildLayout() {
  const ready = useSessionStore((state) => state.ready);
  // Sessions are saved on the device: wait for them before anything can start a new one.
  const hydrated = usePracticeHydrated();
  const screenOptions = useStackScreenOptions();

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
