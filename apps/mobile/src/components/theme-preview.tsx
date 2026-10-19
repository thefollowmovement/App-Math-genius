import { ThemeProvider, useTheme, type Theme } from '@math-genius/ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';

import { useStackScreenOptions } from '@/hooks/use-stack-screen-options';

/** Shows a screen in another theme than its stack's, header and status bar included. */
export function ThemePreview({ theme, children }: PropsWithChildren<{ theme: Theme }>) {
  return (
    <ThemeProvider theme={theme}>
      <PreviewChrome />
      {children}
    </ThemeProvider>
  );
}

function PreviewChrome() {
  const { colorScheme } = useTheme();
  const options = useStackScreenOptions();
  return (
    <>
      <Stack.Screen options={options} />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}
