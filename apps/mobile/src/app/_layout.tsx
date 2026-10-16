import '../global.css';

import { ThemeProvider, themes, useTheme } from '@math-genius/ui';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { router, Stack, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { startNetworkListener } from '@/data/network';
import { startSyncTriggers } from '@/data/practice/sync';
import { persistOptions, queryClient } from '@/data/query-client';
import { startSessionListener } from '@/data/session';
import { useStackScreenOptions } from '@/hooks/use-stack-screen-options';
import { onNotificationTapped, showNotificationsInForeground } from '@/lib/notifications';

export default function RootLayout() {
  useEffect(() => {
    startNetworkListener();
    startSessionListener();
    startSyncTriggers();
  }, []);
  // Notifications are optional (none on web or in Expo Go on Android): loaded here, never at import.
  // A tapped reminder opens its screen: the child's home, or the child's page for a parent.
  useEffect(() => {
    showNotificationsInForeground();
    return onNotificationTapped((route) => router.push(route as Href));
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <ThemeProvider theme={themes.kawaii}>
          <RootStack />
        </ThemeProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { colorScheme } = useTheme();
  const screenOptions = useStackScreenOptions();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ ...screenOptions, headerShown: false }} />
    </>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
