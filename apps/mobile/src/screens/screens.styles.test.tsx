import { worldMap } from '@math-genius/exercise-engine';
import { DEFAULT_ROUTINE } from '@math-genius/shared';
import type { ReactElement } from 'react';
import { registerCSS } from 'react-native-css/jest';

import { badgeGroups } from '@/data/badges-model';
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
import { award, rewards } from '@/test-utils/rewards';

import { Badges } from './badges';
import { ChestOpening } from './chest-opening';
import { ChildDetail } from './child-detail';
import { ChildForm } from './child-form';
import { ChildHome } from './child-home';
import { PairDevice } from './pair-device';
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

const globalCss = compileGlobalCss();

const lea: Child = {
  id: 'lea',
  display_name: 'Léa',
  gender: 'girl',
  grade: 'CE2',
  birth_year: null,
  theme_id: 'kawaii',
};
const tom: Child = { ...lea, id: 'tom', display_name: 'Tom', gender: 'boy', grade: 'CM1' };
const vacation: VacationRow = {
  id: 'toussaint',
  child_id: 'lea',
  from_date: '2026-10-17',
  to_date: '2026-11-01',
};

const screens: { name: string; render: () => ReactElement }[] = [
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
        routine={{ ...DEFAULT_ROUTINE, weekendStartTime: '10:30' }}
        vacations={[vacation]}
        onEditRoutine={jest.fn()}
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
        plan="planned"
        goal={{ type: 'duration', minutes: 15 }}
        rewards={rewards([{ id: 'chest-1', kind: 'common' }])}
        onOpenChest={jest.fn()}
        onOpenBadges={jest.fn()}
        sync="offline"
        onStart={jest.fn()}
        onSwitchProfile={jest.fn()}
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
        groups={shopGroups([{ item_code: 'kitten', equipped: true }])}
        pending={null}
        error="notEnoughGems"
        onBuyFreeze={jest.fn()}
        onBuy={jest.fn()}
        onWear={jest.fn()}
      />
    ),
  },
  {
    name: 'WorldMap',
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
];

describe.each(screens)('$name with native styles', ({ render }) => {
  beforeEach(() => {
    registerCSS(globalCss, nativeCssOptions);
  });

  it('lays out with reasonable numbers and line heights', async () => {
    const { toJSON } = await renderWithTheme(render());
    const styles = hostStyles(toJSON());

    expect(styles.length).toBeGreaterThan(0);
    expect(unreasonableLayoutValues(styles)).toEqual([]);
    expect(badLineHeights(styles)).toEqual([]);
  });
});
