import { getSkill } from '@math-genius/curriculum';
import type { Island, IslandView } from '@math-genius/exercise-engine';
import { Button, Pressable, Screen, ThemedText, View } from '@math-genius/ui';
import { useState } from 'react';

import { Decor } from '@/components/decor';
import { Icon } from '@/components/game/icons';
import { ProgressBar } from '@/components/game/progress-bar';
import { currentStop } from '@/data/mission-model';
import { strings } from '@/i18n';

import { IslandPath, type Selection } from './island-path';
import { BOSS_ROW, ROW } from './path-layout';

const t = strings.map;

type WorldMapProps = {
  islands: IslandView[];
  /** A session is in progress: bosses wait until it ends. */
  busy: boolean;
  onFightBoss: (island: Island) => void;
  /** La Salle de jeux, a page away from the map. */
  onOpenGames?: () => void;
};

/**
 * One island per domain of the child's grade, one at a time (docs/design/maquettes/Carte.html):
 * the path of its skills up to its boss, the hero where the child stands.
 */
export function WorldMap({ islands, busy, onFightBoss, onOpenGames }: WorldMapProps) {
  // The map opens on the island where the child stands.
  const stop = currentStop(islands);
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      islands.findIndex((island) => island.domain === stop?.island.domain),
    ),
  );
  const island = islands[index] ?? islands[0];
  if (!island) return <Screen>{null}</Screen>;
  return (
    <IslandScreen
      // A new island starts on its own stop.
      key={island.domain}
      island={island}
      index={index}
      count={islands.length}
      current={stop?.island.domain === island.domain ? stop.node.code : null}
      busy={busy}
      onMove={(step) => setIndex((current) => current + step)}
      onFightBoss={() => onFightBoss({ grade: island.grade, domain: island.domain })}
      onOpenGames={onOpenGames}
    />
  );
}

type IslandScreenProps = {
  island: IslandView;
  index: number;
  count: number;
  current: string | null;
  busy: boolean;
  onMove: (step: -1 | 1) => void;
  onFightBoss: () => void;
  onOpenGames?: () => void;
};

function IslandScreen({
  island,
  index,
  count,
  current,
  busy,
  onMove,
  onFightBoss,
  onOpenGames,
}: IslandScreenProps) {
  const [selected, setSelected] = useState<Selection>(current ?? 'boss');
  const name = t.islands[island.domain].name;
  // Opens on where the child stands, a little below the top.
  const at = island.skills.findIndex((node) => node.code === current);
  const scrollTo =
    at < 0 ? 0 : Math.max(0, BOSS_ROW + (island.skills.length - 1 - at) * ROW - ROW * 2);

  return (
    <Screen
      backdrop={<Decor />}
      scrollTo={scrollTo}
      top={
        <View className="gap-3">
          <View className="flex-row items-center justify-between gap-2">
            <Arrow
              icon="back"
              label={t.previous}
              disabled={index === 0}
              onPress={() => onMove(-1)}
            />
            <View className="flex-1 items-center">
              <ThemedText variant="label" tone="secondary">
                {t.island(index + 1, island.grade)}
              </ThemedText>
              <ThemedText variant="score" className="text-center" accessibilityRole="header">
                {name}
              </ThemedText>
            </View>
            <Arrow
              icon="forward"
              label={t.next}
              disabled={index === count - 1}
              onPress={() => onMove(1)}
            />
          </View>
          {island.playable > 0 ? (
            <View className="flex-row items-center gap-3">
              <ProgressBar
                value={island.mastered / island.playable}
                fill="accent"
                label={t.progress(island.mastered, island.playable)}
                className="flex-1"
              />
              <ThemedText variant="tag" tone="accent">
                {t.counter(island.mastered, island.playable)}
              </ThemedText>
            </View>
          ) : (
            <ThemedText variant="caption" className="text-center">
              {t.soon}
            </ThemedText>
          )}
          {onOpenGames ? (
            <Button
              title={strings.games.room.open}
              accessibilityLabel={`${strings.games.room.open}. ${strings.games.room.openHint}`}
              variant="outline"
              icon={<Icon name="games" color="foreground" size="sm" />}
              onPress={onOpenGames}
            />
          ) : null}
        </View>
      }
      footer={<Details island={island} selected={selected} busy={busy} onFightBoss={onFightBoss} />}
    >
      <IslandPath island={island} current={current} selected={selected} onSelect={setSelected} />
    </Screen>
  );
}

function Arrow({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'back' | 'forward';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className={
        disabled
          ? 'size-11 items-center justify-center rounded-md border-2 border-border bg-surface opacity-40'
          : 'size-11 items-center justify-center rounded-md border-2 border-border bg-surface active:opacity-80'
      }
    >
      <Icon name={icon} color="foreground" size="sm" />
    </Pressable>
  );
}

type DetailsProps = {
  island: IslandView;
  selected: Selection;
  busy: boolean;
  onFightBoss: () => void;
};

/** The stop the child touched: a skill and its mastery, or the boss and how to face it. */
function Details({ island, selected, busy, onFightBoss }: DetailsProps) {
  const node = island.skills.find((skill) => skill.code === selected);
  const boss = !node;
  return (
    <View
      accessibilityLiveRegion="polite"
      className="gap-3 rounded-lg border-2 border-border bg-surface p-4"
    >
      <View className="flex-row items-center gap-3">
        <View className="size-11 items-center justify-center rounded-md border-2 border-success bg-background">
          <Icon name={boss ? 'bolt' : 'plus'} color="successInk" />
        </View>
        <View className="flex-1">
          <ThemedText variant="headline">
            {node ? getSkill(node.code).title : t.boss.title}
          </ThemedText>
          <ThemedText variant="caption">
            {node ? t.masteryLine(t.status[node.status], node.mastery) : t.boss[island.boss]}
          </ThemedText>
        </View>
      </View>
      {boss && island.boss !== 'locked' ? (
        busy ? (
          <ThemedText variant="caption">{t.boss.busy}</ThemedText>
        ) : (
          <Button title={t.boss.fight} onPress={onFightBoss} />
        )
      ) : null}
    </View>
  );
}
