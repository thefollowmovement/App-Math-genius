import { screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { ProfilePanel, type ProfilePanelState } from './profile-panel';

const t = strings.childDetail.profile;

const state = (fields: Partial<ProfilePanelState>): ProfilePanelState => ({
  enabled: true,
  profile: {
    computedAt: '2026-10-20T03:00:00Z',
    profile: {
      grade: 'CM2',
      answers: 600,
      mastered: 10,
      inProgress: 3,
      strengths: [{ kind: 'mental_speed', medianMs: 2840, rate: 0.91 }],
      weaknesses: [
        { kind: 'error', error: 'area-perimeter', count: 6, lastSeenAt: '2026-10-19T17:00:00Z' },
        { kind: 'fading', skill: 'ce2.tables-multiplication', mastery: 70 },
      ],
      style: {
        attention: { kind: 'drops', after: 10 },
        bestTime: 'evening',
        afterError: 'perseveres',
        twinSuccess: 0.8,
      },
      computedAt: '2026-10-20T03:00:00Z',
    },
  },
  chosen: [
    { universeId: 'minecraft', name: 'Minecraft', icon: '⛏️' },
    { universeId: 'football', name: 'Foot', icon: '⚽' },
  ],
  others: [{ question_id: 'games', answer: 'Zelda', status: 'pending' }],
  saving: false,
  error: null,
  onEnable: jest.fn(),
  onDisable: jest.fn(),
  onEditUniverse: jest.fn(),
  ...fields,
});

describe('ProfilePanel', () => {
  it('explains what personalization does before the parent turns it on', async () => {
    const onEnable = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <ProfilePanel childName="Léa" {...state({ enabled: false, profile: undefined, onEnable })} />,
    );
    expect(screen.getByText(t.consent.intro('Léa'))).toBeOnTheScreen();
    for (const point of t.consent.points) expect(screen.getByText(point)).toBeOnTheScreen();
    expect(screen.queryByText(t.strengths)).not.toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.consent.enable }));
    expect(onEnable).toHaveBeenCalled();
  });

  it('shows the strengths first, then what to work on, how the child learns and the universe', async () => {
    const onEditUniverse = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(<ProfilePanel childName="Léa" {...state({ onEditUniverse })} />);
    const headers = screen.getAllByRole('header').map((header) => header.props.children);
    expect(headers).toEqual([t.title, t.strengths, t.weaknesses, t.style, t.universe]);
    expect(
      screen.getByText('• Calcul mental rapide : 2,8 s par calcul, 91 % de réussite'),
    ).toBeOnTheScreen();
    expect(screen.getByText('• Confond aire et périmètre (6 fois en 30 jours)')).toBeOnTheScreen();
    expect(screen.getByText('• Perd sa concentration après 10 minutes environ')).toBeOnTheScreen();
    expect(screen.getByText('Minecraft, Foot')).toBeOnTheScreen();
    expect(screen.getByText(`${t.other('Zelda')} (${t.otherStatus.pending})`)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.editUniverse }));
    expect(onEditUniverse).toHaveBeenCalled();
  });

  it('says the profile comes after the next session', async () => {
    await renderWithTheme(<ProfilePanel childName="Léa" {...state({ profile: null })} />);
    expect(screen.getByText(t.pending)).toBeOnTheScreen();
  });

  it('asks for a confirmation before turning it off and deleting everything', async () => {
    const onDisable = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(<ProfilePanel childName="Léa" {...state({ onDisable })} />);
    await user.press(screen.getByRole('button', { name: t.disable }));
    expect(screen.getByText(t.disableConfirm)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.cancel }));
    expect(onDisable).not.toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: t.disable }));
    await user.press(screen.getByRole('button', { name: t.confirm }));
    expect(onDisable).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(t.disableConfirm)).not.toBeOnTheScreen();
  });
});
