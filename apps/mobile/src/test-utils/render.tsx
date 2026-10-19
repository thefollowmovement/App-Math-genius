import { ThemeProvider, themes, type Theme } from '@math-genius/ui';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

export function renderWithTheme(ui: ReactElement, theme: Theme = themes.kawaii) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}
