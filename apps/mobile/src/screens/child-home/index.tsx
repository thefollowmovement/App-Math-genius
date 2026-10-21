import type { SessionGoal } from '@math-genius/exercise-engine';
import { avatarOf, type ChildHighlights, type DayPlan } from '@math-genius/shared';
import { Button, Screen, ThemedText, View } from '@math-genius/ui';

import { Decor } from '@/components/decor';
import { ChestArt } from '@/components/game/chest-art';
import { HeroBust } from '@/components/hero/hero-bust';
import { SpeechBubble } from '@/components/hero/hero-says';
import type { Child } from '@/data/children';
import type { SuperPower } from '@/data/learner-profile-model';
import type { Stop } from '@/data/mission-model';
import type { PlacementOffer } from '@/data/placement-model';
import type { ParentRewardView } from '@/data/parent-rewards-model';
import type { PracticeStatus } from '@/data/practice/summary';
import { progressView, type Rewards, type WeeklyChallenge } from '@/data/rewards-model';
import type { UniverseOffer } from '@/data/universe-model';
import { strings } from '@/i18n';
import { portraitLabel } from '@/i18n/cosmetic-names';
import { goalText } from '@/utils/routine-text';

import { ChallengeCard } from '../rewards/challenge-card';
import { NextRewardCard } from '../rewards/next-reward-card';
import { ChildNav, type NavLink } from './child-nav';
import { MissionCard } from './mission-card';
import { PlacementCard } from './placement-card';
import { RecapCard } from './recap-card';
import { SuperPowerCard } from './super-power-card';
import { TopBar } from './top-bar';
import { UniverseCard } from './universe-card';

const t = strings.childHome;

export type SyncState = 'offline' | 'syncing' | 'idle';

type ChildHomeProps = {
  child: Child;
  practice: PracticeStatus;
  /** What the routine plans today. */
  plan: DayPlan;
  /** Goal of a new session. */
  goal: SessionGoal;
  /** Where the child stands on the world map: the mission's topic. */
  stop?: Stop | null;
  /** The placement test to take, or to resume. */
  placement?: PlacementOffer;
  onStartPlacement?: () => void;
  /** « Ton univers » to answer, once the parent agreed. */
  universe?: UniverseOffer;
  onOpenUniverse?: () => void;
  /** Last week's or last month's card, at the start of a week or a month, until closed. */
  highlights?: ChildHighlights | null;
  onCloseHighlights?: () => void;
  /** The child's first strength, from the learning profile. */
  superPower?: SuperPower | null;
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

/** What the hero says on the home, from the day's plan. */
function message(practice: PracticeStatus, plan: DayPlan, goal: SessionGoal): string {
  if (practice.status === 'unavailable') return t.notAvailable;
  if (practice.status === 'done') return t.todayDone;
  if (practice.status === 'in-progress') return t.ready;
  if (plan.kind === 'off') return t.dayOff;
  if (plan.kind === 'vacation') return t.vacation;
  return t.readyGoal(goalText(goal));
}

/** The child's home (docs/design/maquettes/Main.html): player card, mission, rewards, pages. */
export function ChildHome({
  child,
  practice,
  plan,
  goal,
  stop = null,
  placement = null,
  onStartPlacement,
  universe = null,
  onOpenUniverse,
  superPower = null,
  highlights = null,
  onCloseHighlights,
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
  const nav = t.nav;
  const links = (
    [
      onOpenMap && { key: 'map', icon: 'map', label: nav.map, onPress: onOpenMap },
      onOpenShop && { key: 'shop', icon: 'shop', label: nav.shop, onPress: onOpenShop },
      onOpenBadges && { key: 'badges', icon: 'badges', label: nav.badges, onPress: onOpenBadges },
      onOpenLook && { key: 'look', icon: 'hero', label: nav.look, onPress: onOpenLook },
    ] satisfies (NavLink | undefined)[]
  ).filter((link) => link !== undefined);
  const [chest] = rewards?.chests ?? [];
  const avatar = avatarOf(child.avatar, child.gender);
  return (
    <Screen
      headerless
      backdrop={<Decor />}
      footer={links.length > 0 ? <ChildNav links={links} /> : undefined}
    >
      <TopBar
        name={child.display_name}
        avatar={avatar}
        progress={rewards?.progress ?? progressView(null)}
        badges={rewards?.badges ?? 0}
      />
      {/* The first test comes before the day's mission; a test under way takes its place. */}
      {placement && placement !== 'recheck' && onStartPlacement ? (
        <PlacementCard offer={placement} onStart={onStartPlacement} />
      ) : null}
      {placement === 'resume' ? null : (
        <MissionCard practice={practice} plan={plan} goal={goal} stop={stop} onStart={onStart} />
      )}
      {placement === 'recheck' && onStartPlacement ? (
        <PlacementCard offer={placement} onStart={onStartPlacement} />
      ) : null}
      {/* After the first test: the child is asked about their universe. */}
      {universe && onOpenUniverse && placement !== 'first' && placement !== 'resume' ? (
        <UniverseCard offer={universe} onOpen={onOpenUniverse} />
      ) : null}
      {highlights && onCloseHighlights ? (
        <RecapCard highlights={highlights} avatar={avatar} onClose={onCloseHighlights} />
      ) : null}
      {chest && onOpenChest ? (
        <View className="flex-row items-center gap-3 rounded-lg border-2 border-accent bg-surface p-3 glow-accent">
          <View className="h-14 w-16">
            <ChestArt />
          </View>
          <ThemedText variant="headline" className="flex-1">
            {strings.rewards.chestsWaiting(rewards?.chests.length ?? 1)}
          </ThemedText>
          <Button
            variant="accent"
            title={strings.rewards.open}
            accessibilityLabel={strings.rewards.openChest}
            onPress={() => onOpenChest(chest.id)}
          />
        </View>
      ) : null}
      {challenge || nextReward ? (
        <View className="flex-row gap-3">
          {challenge ? <ChallengeCard challenge={challenge} className="flex-1" /> : null}
          {nextReward ? <NextRewardCard reward={nextReward} className="flex-1" /> : null}
        </View>
      ) : null}
      {superPower ? <SuperPowerCard power={superPower} /> : null}
      {/* The hero stands at the bottom of the page when it is short. */}
      <View className="flex-1" />
      <View className="flex-row items-end gap-3">
        <HeroBust avatar={avatar} size="md" label={portraitLabel(avatar)} />
        <SpeechBubble className="mb-2 flex-1">{message(practice, plan, goal)}</SpeechBubble>
      </View>
      {sync === 'idle' ? null : (
        <ThemedText variant="caption" className="text-center" accessibilityLiveRegion="polite">
          {sync === 'offline' ? t.offline : t.syncing}
        </ThemedText>
      )}
      {onSwitchProfile ? (
        <Button variant="outline" title={t.switchProfile} onPress={onSwitchProfile} />
      ) : null}
    </Screen>
  );
}
