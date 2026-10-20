'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Badge, Button, Card, Loading, Notice, PageHeader, Table, Td, Th } from '@/components/ui';
import { useUniverses, useUpdateUniverse } from '@/data/universes';
import { strings } from '@/i18n/fr';
import { errorText } from '@/lib/errors';
import { addMonths, formatDate, isoDate } from '@/models/dates';
import {
  REVIEW_MONTHS,
  draftOf,
  gradesLabel,
  reviewState,
  type UniverseRow,
} from '@/models/universes';

import { UniverseForm } from './universe-form';

const t = strings.trends;

type Editing = { row: UniverseRow | null; prefill?: { name?: string; category?: string } } | null;

/** The catalogue of references: review alerts, one-click activation, the form. */
export function TrendsView() {
  const today = isoDate(new Date());
  const params = useSearchParams();
  const router = useRouter();
  const universes = useUniverses();
  const update = useUpdateUniverse();
  const [onlyDue, setOnlyDue] = useState(false);
  const fromRadar = params.get('nouveau');
  const [editing, setEditing] = useState<Editing>(
    fromRadar
      ? { row: null, prefill: { name: fromRadar, category: params.get('categorie') ?? undefined } }
      : null,
  );

  const rows = useMemo(() => universes.data ?? [], [universes.data]);
  const due = rows.filter(
    (row) => row.status !== 'retired' && reviewState(row.review_at, today).kind === 'overdue',
  );
  const shown = onlyDue ? due : rows;

  const close = () => {
    setEditing(null);
    if (fromRadar) router.replace('/tendances');
  };

  return (
    <>
      <PageHeader title={strings.pages.tendances} intro={t.intro} />
      <Notice tone={due.length > 0 ? 'warning' : 'success'}>{t.dueCount(due.length)}</Notice>
      {editing ? (
        <UniverseForm
          key={editing.row?.id ?? 'new'}
          initial={draftOf(editing.row, today, editing.prefill)}
          isNew={editing.row === null}
          onDone={close}
        />
      ) : null}
      <Card
        actions={
          <div className="flex flex-wrap gap-2">
            <Button small onClick={() => setOnlyDue(false)} aria-pressed={!onlyDue}>
              {t.filters.all}
            </Button>
            <Button small onClick={() => setOnlyDue(true)} aria-pressed={onlyDue}>
              {t.filters.due} ({due.length})
            </Button>
            <Button small variant="primary" onClick={() => setEditing({ row: null })}>
              {t.add}
            </Button>
          </div>
        }
      >
        {update.error ? <Notice tone="danger">{errorText(update.error)}</Notice> : null}
        {universes.isPending ? (
          <Loading label={strings.loading} />
        ) : universes.error ? (
          <Notice tone="danger">{errorText(universes.error)}</Notice>
        ) : shown.length === 0 ? (
          <p className="text-muted">{t.empty}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t.columns.name}</Th>
                <Th>{t.columns.category}</Th>
                <Th>{t.columns.grades}</Th>
                <Th>{t.columns.pegi}</Th>
                <Th>{t.columns.status}</Th>
                <Th>{t.columns.review}</Th>
                <Th>{t.columns.actions}</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => {
                const review = reviewState(row.review_at, today);
                return (
                  <tr key={row.id}>
                    <Td>
                      <span className="font-medium">{row.name}</span>
                      <span className="block font-mono text-xs text-muted">{row.id}</span>
                    </Td>
                    <Td>{strings.categories[row.category]}</Td>
                    <Td>{gradesLabel(row.grades)}</Td>
                    <Td>{row.pegi ?? '—'}</Td>
                    <Td>
                      <Badge
                        tone={
                          row.status === 'active'
                            ? 'success'
                            : row.status === 'testing'
                              ? 'primary'
                              : 'neutral'
                        }
                      >
                        {strings.statuses[row.status]}
                      </Badge>
                    </Td>
                    <Td>
                      <span className="block">{formatDate(row.review_at)}</span>
                      {row.status !== 'retired' && review.kind === 'overdue' ? (
                        <Badge tone="danger">{t.overdue(review.days)}</Badge>
                      ) : row.status !== 'retired' && review.kind === 'soon' ? (
                        <Badge tone="warning">{t.dueSoon(review.days)}</Badge>
                      ) : null}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        <Button small onClick={() => setEditing({ row })}>
                          {strings.edit}
                        </Button>
                        {row.status === 'active' ? (
                          <Button
                            small
                            variant="danger"
                            disabled={update.isPending}
                            onClick={() =>
                              update.mutate({ id: row.id, fields: { status: 'retired' } })
                            }
                          >
                            {t.retire}
                          </Button>
                        ) : (
                          <Button
                            small
                            variant="primary"
                            disabled={update.isPending}
                            onClick={() =>
                              update.mutate({ id: row.id, fields: { status: 'active' } })
                            }
                          >
                            {t.activate}
                          </Button>
                        )}
                        <Button
                          small
                          variant="ghost"
                          title={t.reviewedHint}
                          disabled={update.isPending}
                          onClick={() =>
                            update.mutate({
                              id: row.id,
                              fields: { review_at: addMonths(today, REVIEW_MONTHS) },
                            })
                          }
                        >
                          {t.reviewed}
                        </Button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
