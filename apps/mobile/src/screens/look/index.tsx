import { Button, Screen, ThemedText, THEME_IDS, View, type ThemeId } from '@math-genius/ui';

import { Decor } from '@/components/decor';
import type { ErrorKind } from '@/data/errors';
import type { Look } from '@/data/look-model';
import { strings } from '@/i18n';

import { ThemeCard } from './theme-card';

const t = strings.look;

type LookEditorProps = {
  /** The look being chosen: the screen is drawn in its theme. */
  look: Look;
  /** Differs from the saved look. */
  changed: boolean;
  saving: boolean;
  error: ErrorKind | null;
  onTheme: (theme: ThemeId) => void;
  onSave: () => void;
};

/** The child chooses a theme (and, soon, an avatar), previewed before it is saved. */
export function LookEditor({ look, changed, saving, error, onTheme, onSave }: LookEditorProps) {
  return (
    <Screen backdrop={<Decor />}>
      <View className="gap-1">
        <ThemedText variant="title" accessibilityRole="header">
          {t.title}
        </ThemedText>
        <ThemedText variant="caption">{t.intro}</ThemedText>
      </View>
      <View className="gap-3" accessibilityRole="radiogroup" accessibilityLabel={t.themes}>
        <ThemedText variant="headline" accessibilityRole="header">
          {t.themes}
        </ThemedText>
        {THEME_IDS.map((id) => (
          <ThemeCard key={id} id={id} chosen={look.theme === id} onPress={() => onTheme(id)} />
        ))}
      </View>
      {error ? (
        <ThemedText tone="danger" accessibilityLiveRegion="polite">
          {strings.errors[error]}
        </ThemedText>
      ) : null}
      <Button size="lg" title={t.save} loading={saving} disabled={!changed} onPress={onSave} />
    </Screen>
  );
}
