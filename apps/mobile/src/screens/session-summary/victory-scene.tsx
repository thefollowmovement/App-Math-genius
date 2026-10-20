import { heroLook, type Award } from '@math-genius/shared';
import { ThemedText, View } from '@math-genius/ui';
import type { ViewStyle } from 'react-native';
import Animated, {
  css,
  cubicBezier,
  useReducedMotion,
  type CSSStyle,
} from 'react-native-reanimated';

import { ChestArt } from '@/components/game/chest-art';
import { useChildHero } from '@/components/hero/hero-context';
import { HeroPicture } from '@/components/hero/hero-view';
import { strings } from '@/i18n';

const t = strings.summary;

type VictorySceneProps = {
  /** The mission is validated: the hero jumps for joy; otherwise it encourages. */
  won: boolean;
  /** The chest the session earned, once the server has said so. */
  chest: Award['chest'];
};

/** The hero in its victory pose next to the chest it earned (docs/design/maquettes/Victoire.html). */
export function VictoryScene({ won, chest }: VictorySceneProps) {
  const look = heroLook(useChildHero());
  const reduced = useReducedMotion();
  const pose = won ? 'victory' : 'encourage';
  return (
    // Rare moment (the end of a session), worth a short pop, skipped with reduced motion.
    <Animated.View style={reduced ? undefined : styles.pop}>
      <View className="items-center">
        {chest ? (
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={chest.kind === 'rare' ? t.rareChest : t.chest}
            className="h-52 w-60"
          >
            <ChestArt />
            <View className="absolute -bottom-1 -left-18 h-50 w-34">
              <HeroPicture look={look} pose={pose} />
            </View>
            {chest.kind === 'rare' ? (
              <View className="absolute right-0 top-1 rotate-8 rounded-full bg-accent px-3 py-1">
                <ThemedText variant="tag" tone="onAccent">
                  {t.rare}
                </ThemedText>
              </View>
            ) : null}
          </View>
        ) : (
          <View className="h-52 w-36">
            <HeroPicture look={look} pose={pose} />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// CSS animation, not a layout one: on the web, Reanimated replays an entering animation, with the
// view positioned absolutely, when the content below changes.
const pop = css.keyframes({
  '0%': { opacity: 0, transform: [{ scale: 0.9 }] },
  '70%': { opacity: 1, transform: [{ scale: 1.04 }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }] },
});

const styles: Record<'pop', CSSStyle<ViewStyle>> = {
  pop: {
    animationName: pop,
    animationDuration: '400ms',
    animationTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
  },
};
