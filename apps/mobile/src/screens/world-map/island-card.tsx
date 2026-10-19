import { getSkill } from '@math-genius/curriculum';
import type { IslandView, SkillNode } from '@math-genius/exercise-engine';
import { Button, ThemedText, View, cx } from '@math-genius/ui';

import { strings } from '@/i18n';

const t = strings.map;

/** The path winds from one side to the other. */
const PATH_OFFSETS = ['ml-0', 'ml-6', 'ml-12', 'ml-6'] as const;

type IslandCardProps = {
  island: IslandView;
  /** A session is in progress: the boss waits until it ends. */
  busy: boolean;
  onFightBoss: () => void;
};

/** One island: its path of skills, then its boss. */
export function IslandCard({ island, busy, onFightBoss }: IslandCardProps) {
  const name = t.islands[island.domain];
  const open = island.boss !== 'locked';
  return (
    <View className="gap-4 rounded-lg border border-border bg-surface p-4">
      <View className="gap-1">
        <ThemedText variant="title" accessibilityRole="header">
          {`${name.icon} ${name.name}`}
        </ThemedText>
        <ThemedText variant="caption">
          {island.playable > 0 ? t.progress(island.mastered, island.playable) : t.soon}
        </ThemedText>
      </View>
      <View className="gap-2">
        {island.skills.map((node, index) => (
          <PathNode
            key={node.code}
            node={node}
            offset={PATH_OFFSETS[index % PATH_OFFSETS.length] ?? 'ml-0'}
          />
        ))}
      </View>
      <View
        className={cx(
          'gap-3 rounded-lg border p-4',
          open ? 'border-primary bg-background' : 'border-border bg-background',
        )}
      >
        <View className="flex-row items-center gap-3">
          <ThemedText variant="title" className={open ? undefined : 'opacity-40'}>
            {t.boss.icon}
          </ThemedText>
          <View className="flex-1 gap-1">
            <ThemedText variant="headline">{t.boss.name}</ThemedText>
            <ThemedText variant="caption">{t.boss[island.boss]}</ThemedText>
          </View>
        </View>
        {open ? (
          busy ? (
            <ThemedText variant="caption">{t.boss.busy}</ThemedText>
          ) : (
            <Button title={t.boss.fight} onPress={onFightBoss} />
          )
        ) : null}
      </View>
    </View>
  );
}

function PathNode({ node, offset }: { node: SkillNode; offset: string }) {
  const { title } = getSkill(node.code);
  const status = t.status[node.status];
  const dim = node.status === 'locked' || node.status === 'coming_soon';
  return (
    <View
      accessible
      accessibilityLabel={t.node(title, status, node.mastery)}
      className={cx('flex-row items-center gap-3', offset)}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
        <ThemedText className={dim ? 'opacity-40' : undefined}>
          {t.statusIcon[node.status]}
        </ThemedText>
      </View>
      <View className="flex-1">
        <ThemedText tone={dim ? 'muted' : 'default'}>{title}</ThemedText>
        <ThemedText variant="caption">
          {node.mastery === null ? status : `${status} · ${node.mastery} / 100`}
        </ThemedText>
      </View>
    </View>
  );
}
