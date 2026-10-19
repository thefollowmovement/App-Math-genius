import type { Island, IslandView } from '@math-genius/exercise-engine';
import { Screen, ThemedText, View } from '@math-genius/ui';

import { Decor } from '@/components/decor';
import { strings } from '@/i18n';

import { IslandCard } from './island-card';

const t = strings.map;

type WorldMapProps = {
  islands: IslandView[];
  /** A session is in progress: bosses wait until it ends. */
  busy: boolean;
  onFightBoss: (island: Island) => void;
};

/** One island per domain of the child's grade, with the path of its skills and its boss. */
export function WorldMap({ islands, busy, onFightBoss }: WorldMapProps) {
  return (
    <Screen backdrop={<Decor />}>
      <View className="gap-1">
        <ThemedText variant="title">{t.title}</ThemedText>
        <ThemedText variant="caption">{t.intro}</ThemedText>
      </View>
      {islands.map((island) => (
        <IslandCard
          key={island.domain}
          island={island}
          busy={busy}
          onFightBoss={() => onFightBoss({ grade: island.grade, domain: island.domain })}
        />
      ))}
    </Screen>
  );
}
