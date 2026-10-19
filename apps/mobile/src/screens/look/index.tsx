import type { CosmeticId, CosmeticSlot, HeroId, Unlocked } from '@math-genius/shared';
import { Button, Screen, ThemedText, THEME_IDS, View, type ThemeId } from '@math-genius/ui';

import { CenterGlow } from '@/components/decor';
import { HeroBust } from '@/components/hero/hero-bust';
import type { ErrorKind } from '@/data/errors';
import type { LockedHint, Look } from '@/data/look-model';
import { strings } from '@/i18n';
import { lockedText, portraitLabel } from '@/i18n/cosmetic-names';

import { CosmeticPicker } from './cosmetic-picker';
import { HeroPicker } from './hero-picker';
import { ThemeCard } from './theme-card';

const t = strings.look;

type LookEditorProps = {
  /** The look being chosen: the screen is drawn in its theme. */
  look: Look;
  /** Badges earned and items bought: they unlock cosmetics. */
  unlocked: Unlocked;
  /** The cosmetic just tried before it was unlocked. */
  hint: LockedHint | null;
  /** Differs from the saved look. */
  changed: boolean;
  saving: boolean;
  error: ErrorKind | null;
  onHero: (hero: HeroId) => void;
  onCosmetic: (slot: CosmeticSlot, id: CosmeticId | null) => void;
  onTheme: (theme: ThemeId) => void;
  onSave: () => void;
};

/** The child picks their hero, what surrounds it and a theme, previewed before it is saved. */
export function LookEditor({
  look,
  unlocked,
  hint,
  changed,
  saving,
  error,
  onHero,
  onCosmetic,
  onTheme,
  onSave,
}: LookEditorProps) {
  const hero = strings.heroes.items[look.avatar.hero];
  return (
    <Screen
      backdrop={<CenterGlow />}
      footer={
        <Button size="lg" title={t.save} loading={saving} disabled={!changed} onPress={onSave} />
      }
    >
      <View className="flex-row items-center gap-4">
        <HeroBust avatar={look.avatar} size="lg" label={portraitLabel(look.avatar)} />
        <View className="flex-1 gap-1">
          <ThemedText variant="label" tone="secondary">
            {t.title}
          </ThemedText>
          <ThemedText variant="title" accessibilityRole="header">
            {hero.name}
          </ThemedText>
          <ThemedText variant="caption">{t.intro}</ThemedText>
        </View>
      </View>
      <View className="gap-3">
        <ThemedText variant="label" accessibilityRole="header">
          {t.hero}
        </ThemedText>
        <HeroPicker chosen={look.avatar.hero} onPick={onHero} />
      </View>
      <View className="gap-3">
        <ThemedText variant="label" accessibilityRole="header">
          {t.style}
        </ThemedText>
        <CosmeticPicker
          avatar={look.avatar}
          unlocked={unlocked}
          tried={hint?.cosmetic ?? null}
          onPick={onCosmetic}
        />
        {hint ? (
          <ThemedText className="text-center" accessibilityLiveRegion="polite">
            {lockedText(hint.cosmetic, hint.missing)}
          </ThemedText>
        ) : null}
      </View>
      <View className="gap-3" accessibilityRole="radiogroup" accessibilityLabel={t.themes}>
        <ThemedText variant="label" accessibilityRole="header">
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
    </Screen>
  );
}
