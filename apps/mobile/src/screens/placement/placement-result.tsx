import { getSkill } from '@math-genius/curriculum';
import type { IslandView } from '@math-genius/exercise-engine';
import { Button, Pressable, Screen, ThemedText, View } from '@math-genius/ui';

import { Decor } from '@/components/decor';
import { Icon } from '@/components/game/icons';
import { ProgressBar } from '@/components/game/progress-bar';
import { HeroSays } from '@/components/hero/hero-says';
import type { Stop } from '@/data/mission-model';
import { strings } from '@/i18n';

const t = strings.placement.result;
const map = strings.map;

type PlacementResultProps = {
  /** The child's islands once placed: what the test found acquired shows as already mastered. */
  islands: IslandView[];
  /** The first mission: where the child stands on the map. */
  stop: Stop | null;
  onPlay: () => void;
  onOpenMap: () => void;
  onHome: () => void;
};

/**
 * After the test, the child's result (docs/specs.md): the world map with its islands open and the
 * first mission. No score: the parent sees the details.
 */
export function PlacementResult({
  islands,
  stop,
  onPlay,
  onOpenMap,
  onHome,
}: PlacementResultProps) {
  return (
    <Screen
      headerless
      backdrop={<Decor />}
      footer={
        <View className="gap-3">
          {stop ? <Button size="lg" title={t.play} onPress={onPlay} /> : null}
          <Button variant="outline" title={t.map} onPress={onOpenMap} />
        </View>
      }
    >
      <View className="flex-row justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.close}
          onPress={onHome}
          hitSlop={4}
          className="size-11 items-center justify-center rounded-md border-2 border-border bg-surface active:opacity-80"
        >
          <Icon name="close" color="muted" size="sm" />
        </Pressable>
      </View>
      <View className="items-center gap-1">
        <ThemedText variant="label" tone="secondary">
          {t.label}
        </ThemedText>
        <ThemedText variant="title" className="text-center halo-primary" accessibilityRole="header">
          {t.title}
        </ThemedText>
      </View>
      <HeroSays pose="victory" size="md">
        {t.hero}
      </HeroSays>
      <View className="gap-3">
        <ThemedText variant="label" tone="secondary">
          {t.islands}
        </ThemedText>
        {islands.map((island) => (
          <IslandRow key={island.domain} island={island} />
        ))}
      </View>
      {stop ? (
        <View className="gap-2 rounded-lg border-3 border-primary bg-surface bg-linear-160 from-raised to-surface p-5 glow-primary">
          <ThemedText variant="label" tone="secondary">
            {t.mission}
          </ThemedText>
          <ThemedText variant="headline">{map.islands[stop.island.domain].name}</ThemedText>
          <ThemedText tone="muted">{getSkill(stop.node.code).title}</ThemedText>
        </View>
      ) : (
        <ThemedText tone="muted" className="text-center">
          {t.allDone}
        </ThemedText>
      )}
    </Screen>
  );
}

function IslandRow({ island }: { island: IslandView }) {
  const name = map.islands[island.domain];
  const soon = island.playable === 0;
  return (
    <View
      accessible
      accessibilityLabel={`${name.name} : ${soon ? t.soon : map.progress(island.mastered, island.playable)}`}
      className="flex-row items-center gap-3 rounded-lg border-2 border-border bg-surface p-3"
    >
      <View className="size-12 items-center justify-center rounded-full bg-background">
        <ThemedText variant="title">{name.icon}</ThemedText>
      </View>
      <View className="flex-1 gap-1">
        <ThemedText variant="headline">{name.name}</ThemedText>
        {soon ? (
          <ThemedText variant="caption">{t.soon}</ThemedText>
        ) : (
          <>
            <ProgressBar
              value={island.mastered / island.playable}
              size="sm"
              label={name.name}
              valueText={map.progress(island.mastered, island.playable)}
            />
            <ThemedText variant="caption">
              {map.progress(island.mastered, island.playable)}
            </ThemedText>
          </>
        )}
      </View>
    </View>
  );
}
