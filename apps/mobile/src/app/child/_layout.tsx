import { ThemeProvider, themeOf, useTheme } from '@math-genius/ui';
import { Stack, useGlobalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

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
  const kind = useAccountKind();
  const children = useChildren().data ?? [];
  // Reminders reach the child's device, app closed; once paired, it also tells the parent whether
  // it can show them. A parent in child mode keeps their own alerts.
  usePushRegistration(kind === 'device' && children.length > 0 ? 'device' : null);
  // The child's screens take the child's theme: the child of the route (?id=), or the only one.
  const { id } = useGlobalSearchParams<{ id?: string }>();
  const [onlyChild] = children.length === 1 ? children : [];
  const child = children.find((candidate) => candidate.id === id) ?? onlyChild;

  if (!ready || !hydrated) return <LoadingScreen />;

  return (
    <ThemeProvider theme={themeOf(child?.theme_id)}>
      <ChildStack />
    </ThemeProvider>
  );
}

function ChildStack() {
  const { colorScheme } = useTheme();
  const screenOptions = useStackScreenOptions();
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ ...screenOptions, title: '' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="practice" options={{ headerShown: false }} />
        <Stack.Screen name="summary" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="chest" options={{ headerShown: false, presentation: 'modal' }} />
        {/* These screens show their own title. */}
        <Stack.Screen name="badges" />
        <Stack.Screen name="map" />
        <Stack.Screen name="shop" />
        <Stack.Screen name="look" />
      </Stack>
    </>
  );
}
