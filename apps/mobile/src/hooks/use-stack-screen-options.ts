import { useTheme } from '@math-genius/ui';
import type { ComponentProps } from 'react';
import type { Stack } from 'expo-router';

// The options object, not the function form: a screen can also take it (<Stack.Screen options>).
type ScreenOptions = Exclude<
  NonNullable<ComponentProps<typeof Stack>['screenOptions']>,
  (...args: never[]) => unknown
>;

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
