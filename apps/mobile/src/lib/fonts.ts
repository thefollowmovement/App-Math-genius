import { Bangers_400Regular } from '@expo-google-fonts/bangers/400Regular';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Orbitron_700Bold } from '@expo-google-fonts/orbitron/700Bold';
import { useFonts } from 'expo-font';

/**
 * The themes' heading fonts (Theme.typography.headingFont), by the names the themes use. Only the
 * weight each theme needs is bundled. Fonts under the SIL Open Font License (Google Fonts).
 */
export const THEME_FONTS = { Fredoka_600SemiBold, Bangers_400Regular, Orbitron_700Bold };

/** True once the fonts are ready, or failed to load (titles then use the system font). */
export function useThemeFonts(): boolean {
  const [loaded, error] = useFonts(THEME_FONTS);
  return loaded || error !== null;
}
