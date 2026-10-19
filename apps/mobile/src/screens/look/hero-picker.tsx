import { HERO_IDS, type HeroId } from '@math-genius/shared';
import { Pressable, ThemedText, View, cx } from '@math-genius/ui';

import { HeroBust } from '@/components/hero/hero-bust';
import { strings } from '@/i18n';

const t = strings.heroes;

type HeroPickerProps = {
  chosen: HeroId;
  onPick: (hero: HeroId) => void;
};

/** The six heroes, three by three: the child taps the one that will stand for them. */
export function HeroPicker({ chosen, onPick }: HeroPickerProps) {
  return (
    <View className="flex-row flex-wrap justify-center gap-3">
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
            className={cx(
              'w-28 items-center gap-2 rounded-lg border-2 bg-surface p-3 active:opacity-80',
              picked ? 'border-primary' : 'border-border',
            )}
          >
            <HeroBust avatar={{ hero, wear: {} }} size="md" />
            <ThemedText variant="headline" className="text-center">
              {name}
            </ThemedText>
            <ThemedText variant="caption" className="text-center">
              {role}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
