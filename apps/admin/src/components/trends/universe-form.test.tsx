import { fireEvent, render, screen } from '@testing-library/react';

import { strings } from '@/i18n/fr';
import { draftOf } from '@/models/universes';

import { UniverseForm } from './universe-form';

const mockMutate = jest.fn();
jest.mock('@/data/universes', () => ({
  useSaveUniverse: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

const t = strings.trends;

beforeEach(() => mockMutate.mockClear());

describe('the reference form', () => {
  it('refuses a PEGI 18 game before saving', () => {
    render(
      <UniverseForm
        initial={draftOf(null, '2026-10-20', { name: 'GTA' })}
        isNew
        onDone={jest.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText(t.form.pegi), { target: { value: '18' } });
    fireEvent.click(screen.getByRole('button', { name: strings.save }));
    expect(screen.getByText(t.problems.pegiBanned)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('saves a new trend from its name, « en test »', () => {
    render(<UniverseForm initial={draftOf(null, '2026-10-20')} isNew onDone={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(t.form.name), { target: { value: 'Zelda' } });
    fireEvent.change(screen.getByLabelText(t.form.words), { target: { value: 'rubis, épée' } });
    fireEvent.click(screen.getByRole('button', { name: strings.save }));
    expect(mockMutate).toHaveBeenCalledWith(
      {
        isNew: true,
        record: expect.objectContaining({
          id: 'zelda',
          name: 'Zelda',
          status: 'testing',
          vocabulary: { words: ['rubis', 'épée'] },
          review_at: '2027-01-20',
        }),
      },
      expect.anything(),
    );
  });
});
