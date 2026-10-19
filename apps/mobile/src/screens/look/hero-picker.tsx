import { HERO_IDS, type HeroId } from '@math-genius/shared';
import { Pressable, ThemedText, View, cx, type ThemedTextTone } from '@math-genius/ui';

import { Icon } from '@/components/game/icons';
import { HeroOnStage } from '@/components/hero/hero-view';
import { strings } from '@/i18n';

const t = strings.heroes;

// Each hero's role in its own neon (docs/design/maquettes/Avatars.html), readable in every theme.
const ROLE_TONES: Record<HeroId, ThemedTextTone> = {
  nova: 'primary',
  juno: 'accent',
  mika: 'secondary',
  kai: 'secondary',
  taro: 'success',
  leo: 'fire',
};

type HeroPickerProps = {
  chosen: HeroId;
  onPick: (hero: HeroId) => void;
};

/** The six heroes on stage, three by three: the child taps the one that will stand for them. */
export function HeroPicker({ chosen, onPick }: HeroPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-3" accessibilityRole="radiogroup">
      {HERO_IDS.map((hero) => {
        const { name, role } = t.items[hero];
        const picked = hero === chosen;
        return (
          <Pressable
            key={hero}
            accessibilityRole="radio"
            aria-checked={picked}
            accessibilityLabel={t.label(name, role)}
            onPress={() => onPick(hero)}
            // Three by three: each takes a third of the row, less the gaps.
            className={cx(
              'grow basis-[30%] items-center gap-2 rounded-lg border-3 p-1.5 pb-2 active:opacity-80',
              picked
                ? 'border-primary bg-surface bg-linear-to-b from-primary/25 to-surface glow-primary'
                : 'border-border bg-surface',
            )}
          >
            <View className="h-32 w-full overflow-hidden rounded-md bg-background">
              <HeroOnStage hero={hero} />
            </View>
            {picked ? (
              <View className="absolute right-3 top-3 size-7 items-center justify-center rounded-full bg-primary">
                <Icon name="check" color="onPrimary" size="sm" />
              </View>
            ) : null}
            <ThemedText variant="tag">{name}</ThemedText>
            <View className="rounded-full bg-background px-2 py-1">
              <ThemedText
                variant="caption"
                tone={ROLE_TONES[hero]}
                numberOfLines={2}
                className="text-center"
              >
                {role}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
