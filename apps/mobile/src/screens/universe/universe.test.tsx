import { screen, userEvent } from '@testing-library/react-native';

import { questionsFor } from '@/data/universe-model';
import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';
import { catalogue } from '@/test-utils/universes';

import { UniverseQuestionnaire, type UniverseMode } from '.';

const t = strings.universe;

function renderQuestionnaire(props: {
  mode?: UniverseMode;
  grade?: 'CM1' | '5e';
  saved?: boolean;
}) {
  const handlers = { onSave: jest.fn(), onLater: jest.fn(), onContinue: jest.fn() };
  const view = renderWithTheme(
    <UniverseQuestionnaire
      childName="Léa"
      mode={props.mode ?? 'first'}
      questions={questionsFor(catalogue, props.grade ?? 'CM1')}
      initial={{ music: { universes: ['pop'], other: '' } }}
      saving={false}
      saved={props.saved ?? false}
      error={null}
      {...handlers}
    />,
  );
  return { ...handlers, view };
}

describe('UniverseQuestionnaire', () => {
  it('starts with the hero, then asks one question per screen and saves the choices', async () => {
    const user = userEvent.setup();
    const { onSave, view } = renderQuestionnaire({});
    await view;
    expect(screen.getByRole('header', { name: t.intro.first.title('Léa') })).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.intro.start }));

    expect(screen.getByRole('header', { name: 'À quels jeux tu joues ?' })).toBeOnTheScreen();
    expect(screen.queryByText('Fortnite')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText(t.other)).not.toBeOnTheScreen();
    await user.press(screen.getByRole('checkbox', { name: 'Minecraft' }));
    expect(screen.getByRole('checkbox', { name: 'Minecraft' })).toBeChecked();
    await user.press(screen.getByRole('button', { name: t.next }));

    // The child's earlier answer is kept; touching it again removes it.
    expect(screen.getByRole('checkbox', { name: 'Pop' })).toBeChecked();
    await user.press(screen.getByRole('checkbox', { name: 'Pop' }));
    await user.press(screen.getByRole('button', { name: t.finish }));
    expect(onSave).toHaveBeenCalledWith({
      games: { universes: ['minecraft'], other: '' },
      music: { universes: [], other: '' },
    });
  });

  it('can be left for later, from the introduction or from a question', async () => {
    const user = userEvent.setup();
    const { onLater, view } = renderQuestionnaire({ mode: 'again' });
    await view;
    expect(screen.getByRole('header', { name: t.intro.again.title('Léa') })).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.intro.later }));
    await user.press(screen.getByRole('button', { name: t.intro.start }));
    await user.press(screen.getByRole('button', { name: t.close }));
    expect(onLater).toHaveBeenCalledTimes(2);
  });

  it('offers a free answer at collège, and goes straight to the questions when editing', async () => {
    const user = userEvent.setup();
    const { onSave, view } = renderQuestionnaire({ mode: 'edit', grade: '5e' });
    await view;
    expect(screen.getByRole('checkbox', { name: 'Fortnite' })).toBeOnTheScreen();
    await user.type(screen.getByLabelText(t.other), 'Zelda');
    await user.press(screen.getByRole('button', { name: t.next }));
    await user.press(screen.getByRole('button', { name: t.back }));
    expect(screen.getByLabelText(t.other)).toHaveDisplayValue('Zelda');
    await user.press(screen.getByRole('button', { name: t.next }));
    await user.press(screen.getByRole('button', { name: t.finish }));
    expect(onSave).toHaveBeenCalledWith({
      games: { universes: [], other: 'Zelda' },
      music: { universes: ['pop'], other: '' },
    });
  });

  it('thanks the child once saved', async () => {
    const user = userEvent.setup();
    const { onContinue, view } = renderQuestionnaire({ saved: true });
    await view;
    expect(screen.getByRole('header', { name: t.saved.title })).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.saved.continue }));
    expect(onContinue).toHaveBeenCalled();
  });
});
