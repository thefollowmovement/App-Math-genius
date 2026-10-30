import type { CompanionLook, MiniGameId } from '@math-genius/shared';
import { Screen, ThemedText, View } from '@math-genius/ui';

import { CompanionPicture } from '@/components/companion/companion-picture';
import { Decor } from '@/components/decor';
import { ProgressBar } from '@/components/game/progress-bar';
import type { GameRoomView } from '@/data/games-model';
import { strings } from '@/i18n';

import { GameCard } from './game-card';

const t = strings.games.room;

type GameRoomProps = {
  view: GameRoomView;
  companion: CompanionLook;
  onPlay: (game: MiniGameId) => void;
};

/**
 * La Salle de jeux: the companion waits to play, today's playing time against the parent's limit
 * and the games' gems against their cap, then each game with its record and stars.
 */
export function GameRoom({ view, companion, onPlay }: GameRoomProps) {
  const name = strings.companions.items[companion.id].name;
  const open = view.state === 'open';
  return (
    <Screen backdrop={<Decor />}>
      <ThemedText variant="title" accessibilityRole="header">
        {t.title}
      </ThemedText>
      <View className="flex-row items-center gap-4 rounded-lg border-2 border-border bg-surface p-4">
        <View className="size-20">
          <CompanionPicture companion={companion} float />
        </View>
        <View className="flex-1 gap-2">
          <ThemedText variant="headline">{t.intro(name)}</ThemedText>
          {view.state === 'off' ? null : (
            <>
              <ProgressBar
                value={view.playedMinutes / view.limitMinutes}
                fill="primary"
                size="sm"
                label={t.playtime(view.playedMinutes, view.limitMinutes)}
              />
              <ThemedText variant="caption">
                {t.playtime(view.playedMinutes, view.limitMinutes)}
              </ThemedText>
            </>
          )}
          <ThemedText variant="caption">
            {view.gemsToday >= view.gemsCap ? t.gemsFull : t.gems(view.gemsToday, view.gemsCap)}
          </ThemedText>
        </View>
      </View>
      {open ? null : (
        <View className="rounded-lg border-2 border-accent bg-surface p-4">
          <ThemedText variant="headline" tone="accent">
            {view.state === 'off' ? t.off : t.limitReached}
          </ThemedText>
        </View>
      )}
      {view.cards.map((card) => (
        <GameCard key={card.id} card={card} open={open} onPlay={() => onPlay(card.id)} />
      ))}
    </Screen>
  );
}
