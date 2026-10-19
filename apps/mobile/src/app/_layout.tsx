import '../global.css';

import { ThemeProvider, themes, useTheme } from '@math-genius/ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { strings } from '@/i18n';

export default function RootLayout() {
  return (
    <ThemeProvider theme={themes.kawaii}>
      <RootStack />
    </ThemeProvider>
  );
}

function RootStack() {
  const { colorScheme, colors } = useTheme();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="parent" options={{ title: strings.parentSpace.title }} />
        <Stack.Screen name="child" options={{ title: strings.childSpace.title }} />
      </Stack>
    </>
  );
}
