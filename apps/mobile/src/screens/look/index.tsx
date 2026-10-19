import type { AccessoryCode, AvatarPart } from '@math-genius/shared';
import { Button, Screen, ThemedText, THEME_IDS, View, type ThemeId } from '@math-genius/ui';

import { AvatarPicture } from '@/components/avatar';
import { Decor } from '@/components/decor';
import type { ErrorKind } from '@/data/errors';
import type { LockedHint, Look } from '@/data/look-model';
import { strings } from '@/i18n';

import { AvatarEditor } from './avatar-editor';
import { ThemeCard } from './theme-card';

const t = strings.look;

type LookEditorProps = {
  /** The look being chosen: the screen is drawn in its theme. */
  look: Look;
  /** The accessory worn (shop), shown on the avatar. */
  accessory?: AccessoryCode;
  /** Badges the child has: they open rare options. */
  earned: ReadonlySet<string>;
  hint: LockedHint | null;
  /** Differs from the saved look. */
  changed: boolean;
  saving: boolean;
  error: ErrorKind | null;
  onPart: (part: AvatarPart, option: string) => void;
  onTheme: (theme: ThemeId) => void;
  onSave: () => void;
};

/** The child dresses their avatar and chooses a theme, previewed before it is saved. */
export function LookEditor({
  look,
  accessory,
  earned,
  hint,
  changed,
  saving,
  error,
  onPart,
  onTheme,
  onSave,
}: LookEditorProps) {
  return (
    <Screen backdrop={<Decor />}>
      <View className="gap-1">
        <ThemedText variant="title" accessibilityRole="header">
          {t.title}
        </ThemedText>
        <ThemedText variant="caption">{t.intro}</ThemedText>
      </View>
      <View className="items-center">
        <AvatarPicture
          avatar={look.avatar}
          accessory={accessory}
          size="xl"
          label={accessory ? t.avatarWith(strings.shop.items[accessory].name) : t.avatar}
        />
      </View>
      <AvatarEditor avatar={look.avatar} earned={earned} hint={hint} onPart={onPart} />
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
