import { worldMap } from '@math-genius/exercise-engine';
import { DEFAULT_ROUTINE } from '@math-genius/shared';
import type { ReactElement } from 'react';
import { registerCSS } from 'react-native-css/jest';

import { badgeGroups } from '@/data/badges-model';
import { currentStop } from '@/data/mission-model';
import { questionsFor } from '@/data/universe-model';
import { catalogue } from '@/test-utils/universes';
import type { Child } from '@/data/children';
import { shopGroups } from '@/data/rewards-model';
import type { VacationRow } from '@/data/routine-plan';
import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';
import {
  badLineHeights,
  compileGlobalCss,
  hostStyles,
  nativeCssOptions,
  unreasonableLayoutValues,
} from '@/test-utils/native-styles';

import { attemptViews } from '@/data/session-report';
import { EXERCISE_TYPES, exerciseOfType } from '@/test-utils/exercises';
import { attemptRow, sessionRow } from '@/test-utils/family';
import { rightResponse, wrongResponse } from '@/test-utils/responses';
import { award, parentReward, parentRewards, rewards } from '@/test-utils/rewards';

import { Badges } from './badges';
import { ChestOpening } from './chest-opening';
import { ChildDetail } from './child-detail';
import { ChildForm } from './child-form';
import { ChildHome } from './child-home';
import { LookEditor } from './look';
import { HeroIntro } from './hero-intro';
import { PairDevice } from './pair-device';
import { PlacementScreen } from './placement';
import { PlacementIntro } from './placement/placement-intro';
import { PlacementResult } from './placement/placement-result';
import { UniverseQuestionnaire } from './universe';
import { ParentHome } from './parent-home';
import { PracticeScreen } from './practice';
import { ProfilePicker } from './profile-picker';
import { RoutineSettings } from './routine-settings';
import { SignIn } from './sign-in';
import { SessionDetail } from './session-detail';
import { SessionSummary } from './session-summary';
import { Shop } from './shop';
import { SignUp } from './sign-up';
import { WorldMap } from './world-map';
import { makeMutable } from 'react-native-reanimated';

import { gameRoomView } from '@/data/games-model';
import { fishingRules } from '@/games/fishing/rules';
import { NO_INPUT } from '@/games/kit/scene';
import { newRound } from '@/games/round';

import { GamePlay } from './game-play';
import { GameRoom } from './game-room';

const globalCss = compileGlobalCss();

const lea: Child = {
  id: 'lea',
  display_name: 'Léa',
  gender: 'girl',
  grade: 'CE2',
  birth_year: null,
  theme_id: 'kawaii',
  avatar: {},
  personalization_consent_at: null,
  universe_asked_at: null,
  game_minutes_limit: 20,
};
const tom: Child = { ...lea, id: 'tom', display_name: 'Tom', gender: 'boy', grade: 'CM1' };
const vacation: VacationRow = {
  id: 'toussaint',
  child_id: 'lea',
  from_date: '2026-10-17',
  to_date: '2026-11-01',
};

const introProps = {
  childName: 'Léa',
  hero: 'mika',
  outfit: null,
  saving: false,
  error: null,
  onPickHero: jest.fn(),
  onConfirmHero: jest.fn(),
  onNext: jest.fn(),
  onStart: jest.fn(),
  onCustomize: jest.fn(),
} as const;

// `tall`: a page longer than a screen by design (a map's path is as long as its island).
const screens: { name: string; render: () => ReactElement; tall?: boolean }[] = [
  {
    name: 'SignUp',
    render: () => (
      <SignUp onSubmit={jest.fn()} submitting={false} error="emailTaken" onGoToSignIn={jest.fn()} />
    ),
  },
  {
    name: 'SignIn',
    render: () => <SignIn onSubmit={jest.fn()} submitting error={null} onGoToSignUp={jest.fn()} />,
  },
  {
    name: 'ParentHome',
    render: () => (
      <ParentHome
        parentName="Camille"
        childProfiles={[lea, tom]}
        today={{
          lea: { status: 'done', main: sessionRow(), startsAt: null },
          tom: {
            status: 'in_progress',
            main: sessionRow({ completed_at: null, answered: 12 }),
            startsAt: null,
          },
        }}
        onAddChild={jest.fn()}
        onOpenChild={jest.fn()}
        onChildMode={jest.fn()}
        onSignOut={jest.fn()}
      />
    ),
  },
  {
    name: 'ChildForm',
    render: () => (
      <ChildForm onSubmit={jest.fn()} submitting={false} error={null} currentYear={2026} />
    ),
  },
  {
    name: 'ChildDetail',
    render: () => (
      <ChildDetail
        child={lea}
        sessions={[
          sessionRow(),
          sessionRow({ id: 'bonus', kind: 'bonus', completed_at: null, flagged: true }),
        ]}
        onOpenSession={jest.fn()}
        placement={{
          inProgress: false,
          last: {
            takenAt: '2026-10-20T17:12:00Z',
            grade: 'CE2',
            strands: [
              { strand: 'numeration', level: 'ahead', placedRank: 3, answered: 4 },
              { strand: 'fractions', level: 'to_consolidate', placedRank: 0, answered: 5 },
              { strand: 'geometrie', level: null, placedRank: null, answered: 0 },
            ],
            priorities: ['ce2.fractions-unitaires', 'ce2.tables-multiplication'],
          },
        }}
        routine={{ ...DEFAULT_ROUTINE, weekendStartTime: '10:30' }}
        vacations={[vacation]}
        onEditRoutine={jest.fn()}
        rewards={parentRewards({ error: 'network' })}
        profile={{
          enabled: true,
          profile: {
            computedAt: '2026-10-20T03:00:00Z',
            profile: {
              grade: 'CE2',
              answers: 300,
              mastered: 4,
              inProgress: 2,
              strengths: [{ kind: 'best', strand: 'calcul' }],
              weaknesses: [
                {
                  kind: 'error',
                  error: 'forgot-carry',
                  count: 5,
                  lastSeenAt: '2026-10-19T17:00:00Z',
                },
              ],
              style: { attention: null, bestTime: null, afterError: 'guesses', twinSuccess: 0.4 },
              computedAt: '2026-10-20T03:00:00Z',
            },
          },
          chosen: [{ universeId: 'minecraft', name: 'Minecraft', icon: '⛏️' }],
          others: [],
          saving: false,
          error: null,
          onEnable: jest.fn(),
          onDisable: jest.fn(),
          onEditUniverse: jest.fn(),
        }}
        nudge={{ onSend: jest.fn(), sending: false, result: 'no_device', error: 'tooManyMessages' }}
        pairing={{
          status: 'showing',
          code: 'ABC234',
          link: 'mathgenius://child/pair?code=ABC234',
          secondsLeft: 540,
        }}
        creatingCode={false}
        pairingError={null}
        onCreateCode={jest.fn()}
        devices={[
          {
            id: 'phone',
            platform: 'android',
            push_status: 'unsupported',
            paired_at: '2026-10-13T12:00:00Z',
          },
        ]}
        revokingDeviceId={null}
        onRevokeDevice={jest.fn()}
      />
    ),
  },
  {
    name: 'RoutineSettings',
    render: () => (
      <RoutineSettings
        routine={{ ...DEFAULT_ROUTINE, wednesdayStartTime: '14:00' }}
        onSave={jest.fn()}
        saving={false}
        saved
        saveError="network"
        vacations={[vacation]}
        today="2026-10-16"
        onAddVacation={jest.fn()}
        addingVacation={false}
        vacationError={null}
        removingVacationId={null}
        onRemoveVacation={jest.fn()}
      />
    ),
  },
  {
    name: 'PairDevice',
    render: () => (
      <PairDevice onSubmitCode={jest.fn()} submitting={false} error="invalidPairingCode" />
    ),
  },
  {
    name: 'ProfilePicker',
    render: () => (
      <ProfilePicker childProfiles={[lea, tom]} onPick={jest.fn()} onPairAnother={jest.fn()} />
    ),
  },
  {
    name: 'ChildHome',
    render: () => (
      <ChildHome
        child={lea}
        practice={{ status: 'in-progress', percent: 40 }}
        plan={{ kind: 'planned', start: 17 * 60, deadline: 18 * 60 }}
        goal={{ type: 'duration', minutes: 15 }}
        rewards={rewards([{ id: 'chest-1', kind: 'common' }])}
        challenge={{ code: 'combo-10', threshold: 10, progress: 4, gems: 15, completed: false }}
        nextReward={parentReward({ status: 'unlocked', value: 1, unlocked_at: '2026-10-18' })}
        onOpenChest={jest.fn()}
        onOpenBadges={jest.fn()}
        onOpenMap={jest.fn()}
        onOpenShop={jest.fn()}
        onOpenLook={jest.fn()}
        sync="offline"
        onStart={jest.fn()}
        onSwitchProfile={jest.fn()}
      />
    ),
  },
  {
    name: 'ChildHome (placement test)',
    render: () => (
      <ChildHome
        child={lea}
        practice={{ status: 'ready' }}
        plan={{ kind: 'planned', start: 17 * 60, deadline: 18 * 60 }}
        goal={{ type: 'duration', minutes: 15 }}
        placement="first"
        onStartPlacement={jest.fn()}
        sync="idle"
        onStart={jest.fn()}
      />
    ),
  },
  {
    name: 'ChildHome (universe and super-power)',
    render: () => (
      <ChildHome
        child={lea}
        practice={{ status: 'ready' }}
        plan={{ kind: 'planned', start: 17 * 60, deadline: 18 * 60 }}
        goal={{ type: 'duration', minutes: 15 }}
        universe="again"
        onOpenUniverse={jest.fn()}
        superPower={{ kind: 'strand', strand: 'fractions', how: 'ahead' }}
        sync="idle"
        onStart={jest.fn()}
      />
    ),
  },
  {
    name: 'PlacementIntro',
    render: () => (
      <PlacementIntro childName="Léa" recheck={false} onStart={jest.fn()} onLater={jest.fn()} />
    ),
  },
  {
    name: 'UniverseQuestionnaire (introduction)',
    render: () => (
      <UniverseQuestionnaire
        childName="Léa"
        mode="first"
        questions={questionsFor(catalogue, '5e')}
        initial={{}}
        saving={false}
        saved={false}
        error={null}
        onSave={jest.fn()}
        onLater={jest.fn()}
        onContinue={jest.fn()}
      />
    ),
  },
  {
    name: 'UniverseQuestionnaire (question)',
    render: () => (
      <UniverseQuestionnaire
        childName="Léa"
        mode="edit"
        questions={questionsFor(catalogue, '5e')}
        initial={{ games: { universes: ['minecraft'], other: 'Zelda' } }}
        saving={false}
        saved={false}
        error="network"
        onSave={jest.fn()}
        onLater={jest.fn()}
        onContinue={jest.fn()}
      />
    ),
  },
  {
    name: 'UniverseQuestionnaire (saved)',
    render: () => (
      <UniverseQuestionnaire
        childName="Léa"
        mode="first"
        questions={questionsFor(catalogue, 'CM1')}
        initial={{}}
        saving={false}
        saved
        error={null}
        onSave={jest.fn()}
        onLater={jest.fn()}
        onContinue={jest.fn()}
      />
    ),
  },
  {
    name: 'PlacementScreen',
    render: () => (
      <PlacementScreen
        exercise={exerciseOfType('numeric')}
        progress={0.3}
        recheck={false}
        notice="Je n’arrive pas à lire ta réponse."
        onSubmit={jest.fn()}
        onSkip={jest.fn()}
        onPause={jest.fn()}
      />
    ),
  },
  {
    name: 'PlacementResult',
    tall: true,
    render: () => {
      const islands = worldMap({
        grade: 'CM1',
        mastery: {},
        at: '2026-10-20T17:00:00Z',
        defeated: [],
      });
      return (
        <PlacementResult
          islands={islands}
          stop={currentStop(islands)}
          onPlay={jest.fn()}
          onOpenMap={jest.fn()}
          onHome={jest.fn()}
        />
      );
    },
  },
  {
    name: 'HeroIntro (choose)',
    render: () => <HeroIntro {...introProps} step={0} error="network" />,
  },
  {
    name: 'HeroIntro (hero speaks)',
    render: () => <HeroIntro {...introProps} step={3} />,
  },
  {
    name: 'LookEditor',
    render: () => (
      <LookEditor
        savedOutfit={null}
        look={{
          theme: 'space',
          avatar: {
            hero: 'juno',
            wear: { aura: 'aura-gold', accessory: 'crown', companion: 'renard' },
          },
        }}
        unlocked={{ badges: new Set(['streak-7']), owned: new Set(['crown', 'renard']) }}
        hint={{ cosmetic: 'frame-gold', missing: { kind: 'badge', badge: 'boss-perfect' } }}
        onHero={jest.fn()}
        onCosmetic={jest.fn()}
        changed
        saving={false}
        error="avatarLocked"
        onTheme={jest.fn()}
        onSave={jest.fn()}
        universe={{
          chosen: questionsFor(catalogue, 'CM1')[0]?.options ?? [],
          onEdit: jest.fn(),
        }}
      />
    ),
  },
  {
    name: 'Badges',
    render: () => (
      <Badges
        groups={badgeGroups({
          earned: [{ badge_code: 'streak-3', earned_at: '2026-10-07T16:00:00Z' }],
          metrics: { streak_best: 4, validated_daily: 4 },
        })}
      />
    ),
  },
  {
    name: 'Shop',
    render: () => (
      <Shop
        gems={70}
        freezes={1}
        groups={shopGroups([{ item_code: 'lapin', equipped: false }], { companion: 'lapin' })}
        pending={null}
        error="notEnoughGems"
        onBuyFreeze={jest.fn()}
        onBuy={jest.fn()}
        onWear={jest.fn()}
      />
    ),
  },
  {
    name: 'GameRoom',
    render: () => (
      <GameRoom
        view={gameRoomView({
          server: undefined,
          local: { records: { 'peche-eclair': { score: 640, stars: 2 } }, day: null },
          today: '2026-10-21',
          limitMinutes: 20,
        })}
        companion={{ id: 'hibou', stage: 1 }}
        onPlay={jest.fn()}
      />
    ),
  },
  {
    name: 'GamePlay (the end of a round)',
    render: () => (
      <GamePlay
        game="peche-eclair"
        rules={fishingRules}
        phase="over"
        round={newRound(null)}
        prompt="7 × 8"
        companion={{ id: 'hibou', stage: 1 }}
        clock={makeMutable(90_000)}
        input={makeMutable(NO_INPUT)}
        limitMs={90_000}
        outcome={{ roundId: 'r1', score: 760, stars: 2, record: true, right: 6, answered: 8 }}
        award={{ status: 'done', xp: 70, gems: 2, gemsFull: false }}
        loading={false}
        canReplay
        sound
        vibration
        stage={() => null}
        onStart={jest.fn()}
        onPause={jest.fn()}
        onResume={jest.fn()}
        onQuit={jest.fn()}
        onAction={jest.fn()}
        onToggleSound={jest.fn()}
        onToggleVibration={jest.fn()}
        onReplay={jest.fn()}
        onRoom={jest.fn()}
      />
    ),
  },
  {
    name: 'WorldMap',
    tall: true,
    render: () => (
      <WorldMap
        islands={worldMap({ grade: 'CE2', mastery: {}, at: '2026-10-18T17:00:00Z', defeated: [] })}
        busy={false}
        onFightBoss={jest.fn()}
      />
    ),
  },
  {
    name: 'ChestOpening (closed)',
    render: () => (
      <ChestOpening
        kind="rare"
        opened={null}
        opening={false}
        error="network"
        onOpen={jest.fn()}
        onDone={jest.fn()}
      />
    ),
  },
  {
    name: 'ChestOpening (opened)',
    render: () => (
      <ChestOpening
        kind="common"
        opened={{ kind: 'common', gems: 12, total: 57 }}
        opening={false}
        error={null}
        onOpen={jest.fn()}
        onDone={jest.fn()}
      />
    ),
  },
  {
    name: 'SessionDetail',
    render: () => {
      const exercise = exerciseOfType('numeric');
      return (
        <SessionDetail
          session={sessionRow({ goal_met: false, flagged: true })}
          attempts={attemptViews([
            attemptRow(exercise, wrongResponse(exercise)),
            attemptRow(exercise, rightResponse(exercise), {
              position: 1,
              is_correct: true,
              hint_used: true,
            }),
          ])}
        />
      );
    },
  },
  {
    name: 'SessionSummary',
    render: () => (
      <SessionSummary
        summary={{
          kind: 'daily',
          goalMet: true,
          answered: 45,
          correct: 37,
          minutes: 15,
          progressed: [{ title: 'Connaître les tables de multiplication de 2 à 10', mastery: 72 }],
        }}
        saved
        award={{ status: 'ready', award: award({ chest: { id: 'chest-1', kind: 'rare' } }) }}
        onOpenChest={jest.fn()}
        onOpenBadges={jest.fn()}
        effect="confetti"
        onBonus={jest.fn()}
        onHome={jest.fn()}
      />
    ),
  },
  ...EXERCISE_TYPES.flatMap((type) => {
    const exercise = exerciseOfType(type);
    const screen = (feedback: 'none' | 'right' | 'wrong') => (
      <PracticeScreen
        exercise={exercise}
        slot="automatism"
        twin
        reminder={feedback === 'none'}
        progress={0.4}
        count={{ done: 6, total: 15, unit: 'exercises' }}
        combo={feedback === 'right' ? 3 : 0}
        hintShown={false}
        notice={feedback === 'none' ? strings.practice.unreadable : null}
        feedback={
          feedback === 'none'
            ? null
            : {
                response: feedback === 'right' ? rightResponse(exercise) : wrongResponse(exercise),
                correct: feedback === 'right',
                fast: true,
                finished: false,
              }
        }
        onShowHint={jest.fn()}
        onSubmit={jest.fn()}
        onContinue={jest.fn()}
        onPause={jest.fn()}
      />
    );
    return [
      { name: `Practice (${type})`, render: () => screen('none') },
      { name: `Practice (${type}, wrong answer)`, render: () => screen('wrong') },
      { name: `Practice (${type}, right answer)`, render: () => screen('right') },
    ];
  }),
  {
    name: 'Practice (wrong answer, the coach explains)',
    render: () => {
      const exercise = exerciseOfType('numeric');
      return (
        <PracticeScreen
          exercise={exercise}
          slot="current"
          twin={false}
          reminder={false}
          progress={0.4}
          count={{ done: 6, total: 15, unit: 'exercises' }}
          combo={0}
          hintShown={false}
          notice={null}
          feedback={{
            response: wrongResponse(exercise),
            correct: false,
            fast: false,
            finished: false,
          }}
          coach={{
            status: 'shown',
            more: true,
            explanation: {
              what: 'Tu as oublié la retenue, c’est un piège classique !',
              image: 'Dans Minecraft, une rangée pleine de blocs passe à la colonne d’à côté.',
              tip: 'Écris la retenue en haut de la colonne suivante.',
            },
          }}
          onShowHint={jest.fn()}
          onSubmit={jest.fn()}
          onContinue={jest.fn()}
          onUnderstood={jest.fn()}
          onExplainAgain={jest.fn()}
          onPause={jest.fn()}
        />
      );
    },
  },
];

describe.each(screens)('$name with native styles', ({ render, tall }) => {
  beforeEach(() => {
    registerCSS(globalCss, nativeCssOptions);
  });

  it('lays out with reasonable numbers and line heights', async () => {
    const { toJSON } = await renderWithTheme(render());
    const styles = hostStyles(toJSON());

    expect(styles.length).toBeGreaterThan(0);
    expect(unreasonableLayoutValues(styles, tall ? 2500 : 500)).toEqual([]);
    expect(badLineHeights(styles)).toEqual([]);
  });
});
