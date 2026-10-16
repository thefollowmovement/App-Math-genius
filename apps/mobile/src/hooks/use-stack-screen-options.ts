import { useTheme } from '@math-genius/ui';
import type { ComponentProps } from 'react';
import type { Stack } from 'expo-router';

type ScreenOptions = NonNullable<ComponentProps<typeof Stack>['screenOptions']>;

/** Header and background colors of every stack, taken from the active theme. */
export function useStackScreenOptions(): ScreenOptions {
  const { colors } = useTheme();
  return {
    contentStyle: { backgroundColor: colors.background },
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.foreground,
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
  };
}
