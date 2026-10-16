import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { VariableContextProvider } from 'react-native-css';

import { themeToCssVariables } from './css-variables';
import type { Theme } from './types';

const ThemeContext = createContext<Theme | null>(null);

/** Applies a theme to every descendant by setting the CSS variables behind the theme classes. */
export function ThemeProvider({ theme, children }: PropsWithChildren<{ theme: Theme }>) {
  const variables = useMemo(
    () => themeToCssVariables(theme, Platform.OS === 'web' ? 'web' : 'native'),
    [theme],
  );

  return (
    <ThemeContext value={theme}>
      <VariableContextProvider value={variables}>{children}</VariableContextProvider>
    </ThemeContext>
  );
}

/** Raw token values, for the few APIs that cannot take a class (status bar, navigation, Skia). */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return theme;
}
