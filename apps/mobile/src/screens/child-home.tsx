import type { SessionGoal } from '@math-genius/exercise-engine';
import { avatarOf, type DayPlan } from '@math-genius/shared';
import { Button, Screen, ThemedText, View } from '@math-genius/ui';

import { AvatarPicture } from '@/components/avatar';
import { Decor } from '@/components/decor';
import type { Child } from '@/data/children';
import type { ParentRewardView } from '@/data/parent-rewards-model';
import type { PracticeStatus } from '@/data/practice/summary';
import { wornItems, type Rewards, type WeeklyChallenge } from '@/data/rewards-model';
import { strings } from '@/i18n';
import { goalText } from '@/utils/routine-text';

import { ChildShortcuts, type Shortcut } from './child-shortcuts';
import { ChallengeCard } from './rewards/challenge-card';
import { NextRewardCard } from './rewards/next-reward-card';
import { ProgressStrip } from './rewards/progress-strip';

const t = strings.childHome;

export type SyncState = 'offline' | 'syncing' | 'idle';

type ChildHomeProps = {
  child: Child;
  practice: PracticeStatus;
  /** What the routine plans today. */
  plan: DayPlan['kind'];
  /** Goal of a new session. */
  goal: SessionGoal;
  /** Missing until the first award, or while loading. */
  rewards?: Rewards;
  /** This week's challenge, once known. */
  challenge?: WeeklyChallenge | null;
  /** The parent's reward to ask for, or the closest one to unlock. */
  nextReward?: ParentRewardView | null;
  onOpenChest?: (chestId: string) => void;
  onOpenBadges?: () => void;
  onOpenMap?: () => void;
  onOpenShop?: () => void;
  onOpenLook?: () => void;
  sync: SyncState;
  onStart: () => void;
  /** Shown when the device holds several profiles or a parent is signed in. */
  onSwitchProfile?: () => void;
};

const restDay = (plan: DayPlan['kind']) => plan === 'off' || plan === 'vacation';

function message(practice: PracticeStatus, plan: DayPlan['kind'], goal: SessionGoal): string {
  if (practice.status === 'unavailable') return t.notAvailable;
  if (practice.status === 'done') return t.todayDone;
  if (practice.status === 'in-progress') return t.ready;
  if (plan === 'off') return t.dayOff;
  if (plan === 'vacation') return t.vacation;
  return t.readyGoal(goalText(goal));
}

function startLabel(practice: PracticeStatus, plan: DayPlan['kind']): string {
  if (practice.status === 'in-progress') return t.resume(practice.percent);
  if (practice.status === 'done') return t.bonus;
  return restDay(plan) ? t.train : t.start;
}

export function ChildHome({
  child,
  practice,
  plan,
  goal,
  rewards,
  challenge,
  nextReward,
  onOpenChest,
  onOpenBadges,
  onOpenMap,
  onOpenShop,
  onOpenLook,
  sync,
  onStart,
  onSwitchProfile,
}: ChildHomeProps) {
  const icons = t.shortcutIcons;
  const shortcuts = (
    [
      onOpenMap && { key: 'map', icon: icons.map, label: strings.map.open, onPress: onOpenMap },
      onOpenShop && {
        key: 'shop',
        icon: icons.shop,
        label: strings.shop.open,
        onPress: onOpenShop,
      },
      onOpenBadges && {
        key: 'badges',
        icon: icons.badges,
        label: strings.badges.open(rewards?.badges ?? 0),
        onPress: onOpenBadges,
      },
      onOpenLook && {
        key: 'look',
        icon: icons.look,
        label: strings.look.open,
        onPress: onOpenLook,
      },
    ] satisfies (Shortcut | undefined)[]
  ).filter((shortcut) => shortcut !== undefined);
  const [chest] = rewards?.chests ?? [];
  const worn = wornItems(rewards?.items ?? []);
  const companion = worn.companion ? strings.shop.items[worn.companion] : null;
  const accessory = worn.accessory ? strings.shop.items[worn.accessory] : null;
  return (
    <Screen centered backdrop={<Decor />}>
      {rewards ? <ProgressStrip progress={rewards.progress} /> : null}
      <View className="items-center gap-4">
        <View className="flex-row items-end gap-2">
          <AvatarPicture
            avatar={avatarOf(child.avatar, child.gender)}
            accessory={worn.accessory}
            size="lg"
            label={accessory ? strings.look.avatarWith(accessory.name) : strings.look.avatar}
          />
          {companion ? (
            <ThemedText
              variant="display"
              accessibilityLabel={strings.shop.companionLabel(companion.name)}
            >
              {companion.icon}
            </ThemedText>
          ) : null}
        </View>
        <ThemedText variant="display" className="text-center">
          {t.greeting(child.display_name)}
        </ThemedText>
        <ThemedText className="text-center">{message(practice, plan, goal)}</ThemedText>
      </View>
      {chest && onOpenChest ? (
        <View className="gap-3 rounded-lg border border-primary bg-surface p-4">
          <ThemedText variant="headline" className="text-center">
            {strings.rewards.chestsWaiting(rewards?.chests.length ?? 1)}
          </ThemedText>
          <Button
            variant="secondary"
            title={strings.rewards.openChest}
            onPress={() => onOpenChest(chest.id)}
          />
        </View>
      ) : null}
      {practice.status === 'unavailable' ? null : (
        <Button
          size="lg"
          variant={practice.status === 'done' ? 'secondary' : 'primary'}
          title={startLabel(practice, plan)}
          onPress={onStart}
        />
      )}
      {nextReward ? <NextRewardCard reward={nextReward} /> : null}
      {challenge ? <ChallengeCard challenge={challenge} /> : null}
      {shortcuts.length > 0 ? <ChildShortcuts shortcuts={shortcuts} /> : null}
      {sync === 'idle' ? null : (
        <ThemedText variant="caption" className="text-center" accessibilityLiveRegion="polite">
          {sync === 'offline' ? t.offline : t.syncing}
        </ThemedText>
      )}
      {onSwitchProfile ? (
        <Button variant="ghost" title={t.switchProfile} onPress={onSwitchProfile} />
      ) : null}
    </Screen>
  );
}
