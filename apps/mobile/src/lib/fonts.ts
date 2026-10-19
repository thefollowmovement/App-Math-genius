import { Bangers_400Regular } from '@expo-google-fonts/bangers/400Regular';
import { Bungee_400Regular } from '@expo-google-fonts/bungee/400Regular';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Orbitron_700Bold } from '@expo-google-fonts/orbitron/700Bold';
import { useFonts } from 'expo-font';

/**
 * The themes' fonts (Theme.typography: heading and body fonts), by the names the themes use. Only
 * the weights the themes need are bundled. Fonts under the SIL Open Font License (Google Fonts).
 */
export const THEME_FONTS = {
  Bungee_400Regular,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Fredoka_600SemiBold,
  Bangers_400Regular,
  Orbitron_700Bold,
};

/** True once the fonts are ready, or failed to load (texts then use the system font). */
export function useThemeFonts(): boolean {
  const [loaded, error] = useFonts(THEME_FONTS);
  return loaded || error !== null;
}
