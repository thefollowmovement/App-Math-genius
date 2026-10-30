import type { CompanionLook, MiniGameId } from '@math-genius/shared';
import { ThemedText, View } from '@math-genius/ui';
import { use, useState, type ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import type { GameAward } from '@/data/games-model';
import type { SceneInput } from '@/games/kit/scene';
import type { GameRules, RoundState } from '@/games/round';
import type { RoundOutcome, RoundPhase } from '@/hooks/use-game-round';
import { strings } from '@/i18n';

import { ActionButton } from './action-button';
import { EndCard, Overlay, PauseCard, ReadyCard } from './cards';
import { Hud } from './hud';

const t = strings.games;
const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

/** How long the « how to play » line stays, unless the child touches the scene first. */
const HINT_MS = 4000;

export type GamePlayProps = {
  game: MiniGameId;
  rules: GameRules;
  phase: RoundPhase;
  round: RoundState;
  prompt: string | null;
  companion: CompanionLook;
  clock: SharedValue<number>;
  input: SharedValue<SceneInput>;
  limitMs: number;
  outcome: RoundOutcome | null;
  award: GameAward;
  /** The canvas is loading (Skia on the web). */
  loading: boolean;
  canReplay: boolean;
  sound: boolean;
  vibration: boolean;
  /** The game's canvas, sized to the scene's area once it is known. */
  stage: (size: { width: number; height: number }) => ReactNode;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onQuit: () => void;
  onAction: () => void;
  onToggleSound: () => void;
  onToggleVibration: () => void;
  onReplay: () => void;
  onRoom: () => void;
};

/**
 * A round of a mini-game, in the kawaii theme: the question, the score, the time left and the
 * hearts above the scene; the rules before, the pause menu, and the end with its stars and rewards.
 */
export function GamePlay(props: GamePlayProps) {
  const { game, rules, phase, round, prompt, companion, clock, input, limitMs, outcome } = props;
  const insets = use(SafeAreaInsetsContext) ?? NO_INSETS;
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setSize({ width: Math.round(width), height: Math.round(height) });
  };
  const hint = useAnimatedStyle(() => ({
    opacity: input.get().touches > 0 || clock.get() > HINT_MS ? 0 : 1,
  }));
  const playing = phase === 'playing';

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom }}
    >
      <Hud
        prompt={prompt}
        score={round.score}
        hearts={round.hearts}
        clock={clock}
        limitMs={limitMs}
        running={playing}
        onPause={playing ? props.onPause : undefined}
      />
      <View
        className="flex-1 overflow-hidden"
        onLayout={onLayout}
        accessible={playing}
        accessibilityLabel={t.play.sceneLabel(t.items[game].name)}
      >
        {size && phase !== 'ready' ? props.stage(size) : null}
        {playing ? (
          <Animated.View
            pointerEvents="none"
            className="absolute inset-x-0 bottom-6 items-center"
            style={hint}
          >
            <View className="rounded-full bg-surface px-4 py-2">
              <ThemedText variant="headline">{t.items[game].hint}</ThemedText>
            </View>
          </Animated.View>
        ) : null}
      </View>
      {rules.action === 'fish' && phase !== 'ready' ? (
        <View className="px-5 pt-3">
          <ActionButton
            title={t.play.fish}
            label={t.play.fishHint}
            disabled={!playing}
            input={input}
            onAction={props.onAction}
          />
        </View>
      ) : null}

      {phase === 'ready' ? (
        <Overlay>
          <ReadyCard
            game={game}
            companion={companion}
            loading={props.loading}
            canPlay={props.canReplay}
            onStart={props.onStart}
          />
        </Overlay>
      ) : null}
      {phase === 'paused' ? (
        <Overlay>
          <PauseCard
            sound={props.sound}
            vibration={props.vibration}
            onToggleSound={props.onToggleSound}
            onToggleVibration={props.onToggleVibration}
            onResume={props.onResume}
            onQuit={props.onQuit}
          />
        </Overlay>
      ) : null}
      {phase === 'over' && outcome ? (
        <Overlay>
          <EndCard
            outcome={outcome}
            award={props.award}
            companion={companion}
            canReplay={props.canReplay}
            onReplay={props.onReplay}
            onRoom={props.onRoom}
          />
        </Overlay>
      ) : null}
    </View>
  );
}
