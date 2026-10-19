import { isThemeId, useTheme } from '@math-genius/ui';

import { strings } from '@/i18n';

/** The texts of the active theme (strings.themes), such as its victory line. */
export function useThemeStrings() {
  const { id } = useTheme();
  return strings.themes[isThemeId(id) ? id : 'kawaii'];
}
