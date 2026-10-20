'use client';

import type { GradeBand } from '@math-genius/shared';

import { Badge, Card, Loading, Notice, Table, Td, Th } from '@/components/ui';
import { useModerationLog } from '@/data/review';
import { strings } from '@/i18n/fr';
import { errorText } from '@/lib/errors';
import { skillTitle } from '@/models/coach';
import { formatDateTime } from '@/models/dates';

const t = strings.review;

/** What the checks refused or the models failed: never the child. */
export function ModerationLog() {
  const log = useModerationLog();
  const c = t.logColumns;
  return (
    <Card title={t.log}>
      {log.isPending ? (
        <Loading label={strings.loading} />
      ) : log.error ? (
        <Notice tone="danger">{errorText(log.error)}</Notice>
      ) : (log.data ?? []).length === 0 ? (
        <p className="text-muted">{t.logEmpty}</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{c.date}</Th>
              <Th>{c.task}</Th>
              <Th>{c.model}</Th>
              <Th>{c.outcome}</Th>
              <Th>{c.problems}</Th>
              <Th>{c.skill}</Th>
              <Th>{c.band}</Th>
            </tr>
          </thead>
          <tbody>
            {(log.data ?? []).map((entry) => (
              <tr key={entry.id}>
                <Td className="whitespace-nowrap">{formatDateTime(entry.created_at)}</Td>
                <Td>{t.tasks[entry.task] ?? entry.task}</Td>
                <Td className="font-mono text-xs">{entry.model}</Td>
                <Td>
                  <Badge tone={entry.outcome === 'error' ? 'danger' : 'warning'}>
                    {t.outcomes[entry.outcome] ?? entry.outcome}
                  </Badge>
                </Td>
                <Td>{entry.problems.map((code) => t.problems[code] ?? code).join(', ')}</Td>
                <Td>{entry.skill_code ? skillTitle(entry.skill_code) : '—'}</Td>
                <Td>
                  {entry.grade_band
                    ? (strings.bands[entry.grade_band as GradeBand] ?? entry.grade_band)
                    : '—'}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
