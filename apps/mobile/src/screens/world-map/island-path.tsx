import type { IslandView } from '@math-genius/exercise-engine';
import { useTheme, View } from '@math-genius/ui';
import { useState } from 'react';
import Svg, { Path } from 'react-native-svg';

import { Hidden } from '@/components/game/icons';
import { strings } from '@/i18n';

import { BossNode, MapNode } from './map-node';
import { pathCurve, pathLayout } from './path-layout';

/** What the child looks at: a skill of the island (its code), or its boss. */
export type Selection = string | 'boss';

type IslandPathProps = {
  island: IslandView;
  /** The skill where the child stands, on this island. */
  current: string | null;
  selected: Selection;
  onSelect: (selection: Selection) => void;
};

// Half the widths of the stops' columns (w-36 and w-40), to center them on their point.
const NODE_HALF = 72;
const BOSS_HALF = 80;
// Each stop's circle sits this far below the top of its column (room for « C'EST ICI ! »).
const CURRENT_OFFSET = 74;
const NODE_OFFSET = 32;

/** The island's path, winding from its first skill (bottom) up to its boss (top). */
export function IslandPath({ island, current, selected, onSelect }: IslandPathProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const { boss, nodes, height } = pathLayout(island.skills.length, width);
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessibilityLabel={strings.map.pathLabel(strings.map.islands[island.domain].name)}
      style={{ height }}
    >
      {width > 0 ? (
        <Hidden className="absolute inset-0">
          <Svg width={width} height={height}>
            <Path
              d={pathCurve([...nodes, boss])}
              stroke={colors.border}
              strokeWidth={14}
              strokeDasharray="2 22"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Hidden>
      ) : null}
      {width > 0 ? (
        <>
          <View style={{ position: 'absolute', left: boss.x - BOSS_HALF, top: 16 }}>
            <BossNode
              state={island.boss}
              selected={selected === 'boss'}
              onPress={() => onSelect('boss')}
            />
          </View>
          {island.skills.map((node, index) => {
            const point = nodes[index];
            if (!point) return null;
            const here = node.code === current;
            return (
              <View
                key={node.code}
                style={{
                  position: 'absolute',
                  left: point.x - NODE_HALF,
                  top: point.y - (here ? CURRENT_OFFSET : NODE_OFFSET),
                }}
              >
                <MapNode
                  node={node}
                  number={index + 1}
                  current={here}
                  selected={selected === node.code}
                  onPress={() => onSelect(node.code)}
                />
              </View>
            );
          })}
        </>
      ) : null}
    </View>
  );
}
