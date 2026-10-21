import type { CompanionLook, MiniGameId } from '@math-genius/shared';
import { Button, ThemedText, View } from '@math-genius/ui';
import type { ReactNode } from 'react';

import { CompanionPicture } from '@/components/companion/companion-picture';
import { Icon } from '@/components/game/icons';
import { Stars } from '@/components/game/stars';
import { StatTile } from '@/components/game/stat-tile';
import type { GameAward } from '@/data/games-model';
import type { RoundOutcome } from '@/hooks/use-game-round';
import { strings } from '@/i18n';

const t = strings.games;

/** A card over the scene (the start, the pause, the end). */
export function Overlay({ children }: { children: ReactNode }) {
  return (
    <View className="absolute inset-0 items-center justify-center bg-background/80 px-5">
      <View className="w-full max-w-md gap-4 rounded-lg border-2 border-border bg-surface p-5">
        {children}
      </View>
    </View>
  );
}

/** The rules of the game and « JOUER ». */
export function ReadyCard({
  game,
  companion,
  loading,
  canPlay,
  onStart,
}: {
  game: MiniGameId;
  companion: CompanionLook;
  loading: boolean;
  /** False when today's time is up. */
  canPlay: boolean;
  onStart: () => void;
}) {
  const item = t.items[game];
  return (
    <>
      <View className="flex-row items-center gap-4">
        <View className="size-20">
          <CompanionPicture companion={companion} float />
        </View>
        <ThemedText variant="title" accessibilityRole="header" className="flex-1">
          {item.name}
        </ThemedText>
      </View>
      <ThemedText>{item.howTo}</ThemedText>
      {canPlay ? (
        <Button
          title={loading ? t.play.loading : t.play.start}
          size="lg"
          loading={loading}
          icon={<Icon name="play" color="onPrimary" />}
          onPress={onStart}
        />
      ) : (
        <ThemedText variant="headline" tone="accent">
          {t.end.limitReached}
        </ThemedText>
      )}
    </>
  );
}

/** Pause: go on, sounds and vibrations on or off, or stop the round. */
export function PauseCard({
  sound,
  vibration,
  onToggleSound,
  onToggleVibration,
  onResume,
  onQuit,
}: {
  sound: boolean;
  vibration: boolean;
  onToggleSound: () => void;
  onToggleVibration: () => void;
  onResume: () => void;
  onQuit: () => void;
}) {
  return (
    <>
      <ThemedText variant="title" accessibilityRole="header" className="text-center">
        {t.play.paused}
      </ThemedText>
      <Button title={t.play.resume} size="lg" onPress={onResume} />
      <View className="flex-row gap-3">
        <Toggle label={t.play.sound} on={sound} onToggle={onToggleSound} />
        <Toggle label={t.play.vibration} on={vibration} onToggle={onToggleVibration} />
      </View>
      <Button title={t.play.quit} variant="outline" onPress={onQuit} />
    </>
  );
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <View className="flex-1" aria-checked={on} accessibilityRole="switch">
      <Button
        title={label}
        variant={on ? 'secondary' : 'outline'}
        icon={<Icon name={on ? 'check' : 'close'} color={on ? 'onSecondary' : 'muted'} size="sm" />}
        onPress={onToggle}
      />
    </View>
  );
}

/** The end of the round: stars, score, record, rewards, and what to do next. */
export function EndCard({
  outcome,
  award,
  companion,
  canReplay,
  onReplay,
  onRoom,
}: {
  outcome: RoundOutcome;
  award: GameAward;
  companion: CompanionLook;
  canReplay: boolean;
  onReplay: () => void;
  onRoom: () => void;
}) {
  const end = t.end;
  const done = award.status === 'done' ? award : null;
  return (
    <>
      <ThemedText variant="title" accessibilityRole="header" className="text-center">
        {end.titles[outcome.stars] ?? end.titles[0]}
      </ThemedText>
      <Stars count={outcome.stars} label={t.room.stars(outcome.stars)} />
      {outcome.record ? (
        <ThemedText variant="tag" tone="accent" className="text-center">
          {end.record}
        </ThemedText>
      ) : null}
      <View className="flex-row gap-3">
        <StatTile
          label={end.score}
          value={String(outcome.score)}
          accessibilityLabel={end.tile(end.score, String(outcome.score))}
        />
        <StatTile
          label={end.xp}
          value={done ? `+${done.xp}` : '…'}
          accessibilityLabel={end.tile(end.xp, done ? String(done.xp) : end.pending)}
        />
        <StatTile
          label={end.gems}
          value={done ? `+${done.gems}` : '…'}
          accessibilityLabel={end.tile(end.gems, done ? String(done.gems) : end.pending)}
        />
      </View>
      <ThemedText className="text-center">{end.right(outcome.right, outcome.answered)}</ThemedText>
      {done?.gemsFull ? (
        <ThemedText variant="caption" className="text-center">
          {end.gemsFull}
        </ThemedText>
      ) : null}
      {award.status === 'saving' ? (
        <ThemedText variant="caption" className="text-center">
          {end.saved}
        </ThemedText>
      ) : null}
      <View className="flex-row items-center gap-3">
        <View className="size-14">
          <CompanionPicture companion={companion} />
        </View>
        <ThemedText tone="muted" className="flex-1">
          {end.cheer(strings.companions.items[companion.id].name)}
        </ThemedText>
      </View>
      {canReplay ? (
        <Button title={end.again} size="lg" onPress={onReplay} />
      ) : (
        <ThemedText variant="caption" className="text-center">
          {end.limitReached}
        </ThemedText>
      )}
      <Button title={end.room} variant="outline" onPress={onRoom} />
    </>
  );
}
