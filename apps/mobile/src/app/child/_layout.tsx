import { Stack } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useSessionStore } from '@/data/session';
import { useStackScreenOptions } from '@/hooks/use-stack-screen-options';

export default function ChildLayout() {
  const ready = useSessionStore((state) => state.ready);
  const screenOptions = useStackScreenOptions();

  if (!ready) return <LoadingScreen />;

  return (
    <Stack screenOptions={{ ...screenOptions, title: '' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
    </Stack>
  );
}
