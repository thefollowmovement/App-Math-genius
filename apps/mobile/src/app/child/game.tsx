import { isMiniGameId, type MiniGameId } from '@math-genius/shared';
import { ThemeProvider } from '@math-genius/ui';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild, type Child } from '@/data/children';
import { useGameRoom } from '@/data/games';
import {
  gameAwardOf,
  gameCompanion,
  gameRoomView,
  latestLimit,
  roundLength,
  type GameRoomView,
} from '@/data/games-model';
import { lookOf } from '@/data/look-model';
import { usePracticeStore } from '@/data/practice/practice-store';
import { useSessionAward } from '@/data/rewards';
import { rulesOf } from '@/games/catalog';
import { releaseSounds } from '@/games/kit/feedback';
import type { GameRules } from '@/games/round';
import { setGameSound, setGameVibration, useGameSettings } from '@/games/settings';
import { LazyStage, preloadStage } from '@/games/stage-loader';
import { GAME_THEME } from '@/games/theme';
import { useGameRound } from '@/hooks/use-game-round';
import { GamePlay } from '@/screens/game-play';
import { localDate } from '@/utils/local-date';

export default function GameRoute() {
  const { id, game } = useLocalSearchParams<{ id: string; game: string }>();
  const child = useChild(id);
  const room = useGameRoom(id);
  const local = usePracticeStore((state) => state.children[id]?.games);
  const rules = isMiniGameId(game) ? rulesOf(game) : null;
  const home = { pathname: '/child/games', params: { id } } as const;

  if (!rules) return <Redirect href={home} />;
  if (!child.data) return <LoadingScreen />;
  const view = gameRoomView({
    server: room.data,
    local,
    today: localDate(),
    limitMinutes: latestLimit(
      { minutes: child.data.game_minutes_limit, at: child.updatedAt },
      room.data ? { minutes: room.data.limitMinutes, at: room.dataUpdatedAt } : null,
    ),
  });
  // A game turned off by the team, or no time left today: back to the room.
  if (!view.cards.some((card) => card.id === rules.id)) return <Redirect href={home} />;
  return (
    <ThemeProvider theme={GAME_THEME}>
      <StatusBar style={GAME_THEME.colorScheme === 'dark' ? 'light' : 'dark'} />
      <GameRound child={child.data} rules={rules} game={rules.id} view={view} />
    </ThemeProvider>
  );
}

function GameRound({
  child,
  rules,
  game,
  view,
}: {
  child: Child;
  rules: GameRules;
  game: MiniGameId;
  view: GameRoomView;
}) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const settings = useGameSettings();
  const companion = gameCompanion(lookOf(child).avatar);
  const record = view.cards.find((card) => card.id === game)?.record ?? null;
  const round = useGameRound({
    childId: child.id,
    grade: child.grade,
    rules,
    bestScore: record,
  });
  const [loaded, setLoaded] = useState(false);
  const roundId = round.outcome?.roundId;
  const saved = usePracticeStore(
    (state) => !state.children[child.id]?.outbox.some((pending) => pending.id === roundId),
  );
  const award = useSessionAward(roundId, saved && roundId !== undefined);

  useEffect(() => {
    let alive = true;
    preloadStage()
      .then(() => alive && setLoaded(true))
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
      releaseSounds();
    };
  }, []);

  // A round never runs in the background.
  const { phase, pause } = round;
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && phase === 'playing') pause();
    });
    return () => listener.remove();
  }, [phase, pause]);

  const backToRoom = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/child/games', params: { id: child.id } });

  return (
    <GamePlay
      game={game}
      rules={rules}
      phase={round.phase}
      round={round.round}
      prompt={round.prompt}
      companion={companion}
      clock={round.clock}
      input={round.input}
      limitMs={round.limitMs}
      outcome={round.outcome}
      award={gameAwardOf(saved, award.data, round.outcome?.answered ?? 0)}
      loading={!loaded}
      canReplay={view.state === 'open'}
      sound={settings.sound}
      vibration={settings.vibration}
      stage={(size) => (
        <Suspense fallback={null}>
          <LazyStage
            key={round.seed}
            game={game}
            background={rules.background}
            companion={companion.id}
            settings={{ ...size, reducedMotion }}
            feed={round.feed}
            input={round.input}
            clock={round.clock}
            limitMs={round.limitMs}
            running={round.phase === 'playing'}
            seed={round.seed}
            onEvent={round.onEvent}
          />
        </Suspense>
      )}
      // The round's length is fixed when the child presses « JOUER ».
      onStart={() => round.start(roundLength(rules.seconds, view.leftS))}
      onPause={round.pause}
      onResume={round.resume}
      onQuit={round.quit}
      onAction={round.tap}
      onToggleSound={() => setGameSound(!settings.sound)}
      onToggleVibration={() => setGameVibration(!settings.vibration)}
      onReplay={() => round.start(roundLength(rules.seconds, view.leftS))}
      onRoom={backToRoom}
    />
  );
}
