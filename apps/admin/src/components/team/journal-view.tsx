'use client';

import { useMemo } from 'react';

import { Card, Loading, Notice, PageHeader, Table, Td, Th } from '@/components/ui';
import { useAuditLog, useTeam } from '@/data/team';
import { strings } from '@/i18n/fr';
import { errorText } from '@/lib/errors';
import { changesOf } from '@/models/audit';
import { formatDateTime } from '@/models/dates';

const t = strings.journal;
const MAX_SHOWN = 160;
const short = (text: string | null) =>
  text === null ? '∅' : text.length > MAX_SHOWN ? `${text.slice(0, MAX_SHOWN)}…` : text;

/** Who changed what, when, before and after (super-admin only). */
export function JournalView() {
  const log = useAuditLog();
  const team = useTeam();
  const emails = useMemo(
    () => new Map((team.data ?? []).map((member) => [member.user_id, member.email])),
    [team.data],
  );
  const c = t.columns;
  return (
    <>
      <PageHeader title={strings.pages.journal} intro={t.intro} />
      <Card>
        {log.isPending ? (
          <Loading label={strings.loading} />
        ) : log.error ? (
          <Notice tone="danger">{errorText(log.error)}</Notice>
        ) : (log.data ?? []).length === 0 ? (
          <p className="text-muted">{t.empty}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{c.at}</Th>
                <Th>{c.who}</Th>
                <Th>{c.entity}</Th>
                <Th>{c.action}</Th>
                <Th>{c.changes}</Th>
              </tr>
            </thead>
            <tbody>
              {(log.data ?? []).map((row) => (
                <tr key={row.id}>
                  <Td className="whitespace-nowrap">{formatDateTime(row.at)}</Td>
                  <Td>
                    {row.admin_id
                      ? (emails.get(row.admin_id) ?? row.admin_id.slice(0, 8))
                      : t.system}
                  </Td>
                  <Td>
                    <span className="font-mono text-xs">{row.entity}</span>
                    {row.entity_id ? (
                      <span className="block text-xs text-muted">{row.entity_id}</span>
                    ) : null}
                  </Td>
                  <Td>{t.actions[row.action] ?? row.action}</Td>
                  <Td>
                    <ul className="flex flex-col gap-1">
                      {changesOf(row.before, row.after).map((change) => (
                        <li key={change.field} className="text-xs">
                          <span className="font-mono">{change.field}</span> : {short(change.before)}{' '}
                          → {short(change.after)}
                        </li>
                      ))}
                    </ul>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
