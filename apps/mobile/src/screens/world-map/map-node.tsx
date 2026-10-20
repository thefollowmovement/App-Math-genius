import { getSkill } from '@math-genius/curriculum';
import type { BossState, SkillNode } from '@math-genius/exercise-engine';
import { heroLook } from '@math-genius/shared';
import { Pressable, ThemedText, View, cx } from '@math-genius/ui';

import { GlitchArt } from '@/components/game/glitch-art';
import { Icon } from '@/components/game/icons';
import { useChildHero } from '@/components/hero/hero-context';
import { HeroPicture } from '@/components/hero/hero-view';
import { strings } from '@/i18n';

const t = strings.map;

type MapNodeProps = {
  node: SkillNode;
  /** Its place along the path, from 1. */
  number: number;
  /** Where the child stands: the hero is drawn there. */
  current: boolean;
  selected: boolean;
  onPress: () => void;
};

const closed = (node: SkillNode) => node.status === 'locked' || node.status === 'coming_soon';

/** A stop of the path: a mastered skill shines gold, an open one shows its number, a closed one its lock. */
export function MapNode({ node, number, current, selected, onPress }: MapNodeProps) {
  const look = heroLook(useChildHero());
  const title = getSkill(node.code).title;
  const label = t.node(title, t.status[node.status], node.mastery);
  return (
    <View className="w-36 items-center gap-1">
      {current ? (
        <View className="rounded-md bg-primary px-3 py-1">
          <ThemedText variant="tag" tone="onPrimary">
            {t.here}
          </ThemedText>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={current ? `${t.hereLabel} : ${label}` : label}
        aria-selected={selected}
        onPress={onPress}
        hitSlop={8}
        className={cx(
          'items-center justify-center rounded-full active:opacity-80',
          current
            ? 'size-21 border-4 border-foreground bg-primary glow-primary'
            : 'size-16 border-3',
          !current && node.status === 'mastered' && 'border-accent bg-accent ledge',
          !current && !closed(node) && node.status !== 'mastered' && 'border-secondary bg-surface',
          !current && closed(node) && 'border-border bg-surface',
          !current && node.status === 'coming_soon' && 'border-dashed',
          selected && !current && 'border-foreground',
        )}
      >
        {current ? (
          <View className="size-full overflow-hidden rounded-full">
            <HeroPicture look={look} pose="bust" />
          </View>
        ) : node.status === 'mastered' ? (
          <Icon name="star" color="onAccent" size="lg" />
        ) : closed(node) ? (
          <Icon name="lock" color="muted" />
        ) : (
          <ThemedText variant="tag" tone="secondary">
            {String(number)}
          </ThemedText>
        )}
      </Pressable>
      {current || selected ? (
        <ThemedText variant="caption" tone="default" numberOfLines={2} className="text-center">
          {title}
        </ThemedText>
      ) : null}
    </View>
  );
}

type BossNodeProps = {
  state: BossState;
  selected: boolean;
  onPress: () => void;
};

/** The island's boss, Le Glitch, at the top of the path. */
export function BossNode({ state, selected, onPress }: BossNodeProps) {
  return (
    <View className="w-40 items-center gap-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.boss.title} : ${t.boss[state]}`}
        aria-selected={selected}
        onPress={onPress}
        className={cx(
          'size-24 items-center justify-center rounded-lg border-3 bg-raised p-3 active:opacity-80',
          state === 'ready' && 'border-primary glow-primary',
          state === 'defeated' && 'border-success',
          state === 'locked' && (selected ? 'border-foreground' : 'border-border'),
        )}
      >
        <View className={cx('size-full', state === 'locked' && 'opacity-60')}>
          <GlitchArt />
        </View>
      </Pressable>
      <ThemedText variant="tag" tone="muted" className="text-center">
        {t.boss.title}
      </ThemedText>
      <View className="flex-row items-center gap-1">
        {state === 'locked' ? <Icon name="lock" color="muted" size="sm" /> : null}
        <ThemedText variant="caption" tone={state === 'defeated' ? 'success' : 'muted'}>
          {t.boss.short[state]}
        </ThemedText>
      </View>
    </View>
  );
}
