import { render, screen } from '@testing-library/react';

import { strings } from '@/i18n/fr';

import { Heatmap } from './heatmap';

describe('the radar’s heatmap', () => {
  it('says each cell’s reference, month and count', () => {
    render(
      <Heatmap
        title="Radar"
        grid={{
          months: ['2026-09-01', '2026-10-01'],
          rows: [{ id: 'minecraft', name: 'Minecraft', cells: [0, 4], latest: 4, total: 4 }],
          max: 4,
        }}
      />,
    );
    const cell = screen.getByLabelText(/Minecraft · oct\. 26 · 4 enfants/);
    expect(cell).toHaveTextContent('4');
    expect(cell.className).toContain('bg-heat-5');
    expect(screen.getByLabelText(/Minecraft · sept\. 26 · 0 enfant/)).toHaveTextContent('·');
  });

  it('says when nobody has answered yet', () => {
    render(<Heatmap title="Radar" grid={{ months: [], rows: [], max: 0 }} />);
    expect(screen.getByText(strings.radar.chartEmpty)).toBeInTheDocument();
  });
});
