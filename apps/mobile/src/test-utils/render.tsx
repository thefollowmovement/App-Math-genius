import { ThemeProvider, themes, type Theme } from '@math-genius/ui';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

/** Renders in a theme; `rerender` keeps the theme. */
export async function renderWithTheme(ui: ReactElement, theme: Theme = themes.kawaii) {
  const themed = (element: ReactElement) => <ThemeProvider theme={theme}>{element}</ThemeProvider>;
  const result = await render(themed(ui));
  return { ...result, rerender: (element: ReactElement) => result.rerender(themed(element)) };
}
