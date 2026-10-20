'use client';

import { Card, Table, Td, Th } from '@/components/ui';
import { strings } from '@/i18n/fr';
import { formatDate } from '@/models/dates';
import { budgetShare, dollars, type Costs } from '@/models/ai-settings';

const t = strings.ai;

/** A meter: what was spent against its cap. */
function Meter({ label, share }: { label: string; share: number }) {
  const percent = Math.round(share * 100);
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm">{label}</p>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-raised"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className={`h-full rounded-full ${share >= 1 ? 'bg-danger' : share >= 0.8 ? 'bg-warning' : 'bg-primary'}`}
          style={{ width: `${Math.max(percent, share > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}

export function CostsCard({
  costs,
  dailyCap,
  monthlyCap,
}: {
  costs: Costs;
  dailyCap: number;
  monthlyCap: number;
}) {
  const c = t.costColumns;
  return (
    <>
      <Card title={t.budget}>
        <div className="grid gap-4 md:grid-cols-2">
          <Meter
            label={t.spentToday(dollars(costs.spent.today), dollars(dailyCap))}
            share={budgetShare(costs.spent.today, dailyCap)}
          />
          <Meter
            label={t.spentMonth(dollars(costs.spent.month), dollars(monthlyCap))}
            share={budgetShare(costs.spent.month, monthlyCap)}
          />
        </div>
      </Card>
      <Card title={t.costs}>
        {costs.days.length === 0 ? (
          <p className="text-muted">{t.costsEmpty}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{c.day}</Th>
                <Th numeric>{c.calls}</Th>
                <Th numeric>{c.cost}</Th>
                <Th numeric>{c.ok}</Th>
                <Th numeric>{c.rejected}</Th>
                <Th numeric>{c.errors}</Th>
                <Th numeric>{c.latency}</Th>
              </tr>
            </thead>
            <tbody>
              {costs.days.map((day) => (
                <tr key={day.day}>
                  <Td>{formatDate(`${day.day}T12:00:00`)}</Td>
                  <Td numeric>{day.calls}</Td>
                  <Td numeric>{dollars(day.costUsd)}</Td>
                  <Td numeric>{day.ok}</Td>
                  <Td numeric>{day.rejected}</Td>
                  <Td numeric>{day.errors}</Td>
                  <Td numeric>{day.latencyMs}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {costs.children.length > 0 ? (
          <>
            <h3 className="font-medium">{t.children}</h3>
            <Table>
              <thead>
                <tr>
                  <Th>{t.child}</Th>
                  <Th numeric>{c.calls}</Th>
                  <Th numeric>{c.cost}</Th>
                </tr>
              </thead>
              <tbody>
                {costs.children.map((child) => (
                  <tr key={child.child}>
                    <Td className="font-mono text-xs">{child.child.slice(0, 8)}</Td>
                    <Td numeric>{child.calls}</Td>
                    <Td numeric>{dollars(child.costUsd)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        ) : null}
      </Card>
    </>
  );
}
