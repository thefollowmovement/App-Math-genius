import '../global.css';

import { ThemeProvider, themes, useTheme } from '@math-genius/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { queryClient } from '@/data/query-client';
import { startSessionListener } from '@/data/session';
import { useStackScreenOptions } from '@/hooks/use-stack-screen-options';

export default function RootLayout() {
  useEffect(() => {
    startSessionListener();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={themes.kawaii}>
        <RootStack />
      </ThemeProvider>
    </QueryClientProvider>
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
