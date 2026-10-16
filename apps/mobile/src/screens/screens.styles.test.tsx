import type { ReactElement } from 'react';
import { registerCSS } from 'react-native-css/jest';

import type { Child } from '@/data/children';
import { renderWithTheme } from '@/test-utils/render';
import {
  badLineHeights,
  compileGlobalCss,
  hostStyles,
  nativeCssOptions,
  unreasonableLayoutValues,
} from '@/test-utils/native-styles';

import { ChildDetail } from './child-detail';
import { ChildForm } from './child-form';
import { ChildHome } from './child-home';
import { PairDevice } from './pair-device';
import { ParentHome } from './parent-home';
import { ProfilePicker } from './profile-picker';
import { SignIn } from './sign-in';
import { SignUp } from './sign-up';

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
        pairing={{
          status: 'showing',
          code: 'ABC234',
          link: 'mathgenius://child/pair?code=ABC234',
          secondsLeft: 540,
        }}
        creatingCode={false}
        pairingError={null}
        onCreateCode={jest.fn()}
        devices={[{ id: 'phone', platform: 'ios', paired_at: '2026-10-13T12:00:00Z' }]}
        revokingDeviceId={null}
        onRevokeDevice={jest.fn()}
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
  { name: 'ChildHome', render: () => <ChildHome child={lea} onSwitchProfile={jest.fn()} /> },
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
