'use client';

import { strings } from '@/i18n/fr';
import { HEAT_STEPS, heatStep, type RadarGrid } from '@/models/radar';

const t = strings.radar;
const MONTH = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' });
const monthLabel = (iso: string) => MONTH.format(new Date(`${iso}T12:00:00`));

// One hue, light to dark (globals.css): the class of each step, written out for Tailwind.
const FILL = ['', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4', 'bg-heat-5'];
const INK = [
  '',
  'text-heat-ink-1',
  'text-heat-ink-2',
  'text-heat-ink-3',
  'text-heat-ink-4',
  'text-heat-ink-5',
];

/**
 * Children who chose each reference, by month: a heatmap that is also the table (every cell says
 * its number, and its tooltip says what it is).
 */
export function Heatmap({ grid, title }: { grid: RadarGrid; title: string }) {
  if (grid.rows.length === 0) return <p className="text-muted">{t.chartEmpty}</p>;
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="font-medium">{title}</figcaption>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0.5 text-sm">
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                {strings.trends.columns.name}
              </th>
              {grid.months.map((month) => (
                <th
                  key={month}
                  scope="col"
                  className="px-2 py-1 text-center font-normal text-muted"
                >
                  {monthLabel(month)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => (
              <tr key={row.id}>
                <th scope="row" className="max-w-48 truncate pr-3 text-left font-normal">
                  {row.name}
                </th>
                {row.cells.map((value, index) => {
                  const step = heatStep(value, grid.max);
                  const month = grid.months[index] ?? '';
                  const label = `${row.name} · ${monthLabel(month)} · ${t.children(value)}`;
                  return (
                    <td
                      key={month}
                      title={label}
                      aria-label={label}
                      className={`h-9 min-w-14 rounded-sm text-center tabular-nums ${
                        step === 0
                          ? 'bg-raised text-muted'
                          : `${FILL[step]} ${INK[step]} font-medium`
                      }`}
                    >
                      {value === 0 ? '·' : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted" aria-hidden>
        <span>1</span>
        {Array.from({ length: HEAT_STEPS }, (_, index) => (
          <span key={index} className={`h-3 w-6 rounded-sm ${FILL[index + 1]}`} />
        ))}
        <span>{grid.max}</span>
      </div>
    </figure>
  );
}
