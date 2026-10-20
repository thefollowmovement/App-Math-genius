'use client';

import { GRADE_BANDS, type GradeBand } from '@math-genius/shared';
import { useState } from 'react';

import { Badge, Button, Card, Loading, Notice, PageHeader } from '@/components/ui';
import { useActivatePrompt, usePrompts, type PromptRow } from '@/data/prompts';
import { strings } from '@/i18n/fr';
import { errorText } from '@/lib/errors';
import { formatDateTime } from '@/models/dates';

import { PreviewPanel } from './preview-panel';
import { PromptEditor } from './prompt-editor';

const t = strings.prompts;
const bandLabel = (band: string | null) =>
  band && GRADE_BANDS.some((item) => item === band)
    ? strings.bands[band as GradeBand]
    : strings.allBands;

/** The versions of the coach's prompt: read, activate, start a new one from any of them. */
export function PromptsView() {
  const prompts = usePrompts();
  const activate = useActivatePrompt();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PromptRow | null>(null);
  const rows = prompts.data ?? [];
  const selected =
    rows.find((row) => row.id === selectedId) ?? rows.find((row) => row.active) ?? rows[0];

  return (
    <>
      <PageHeader title={strings.pages.prompts} intro={t.intro} />
      {prompts.isPending ? (
        <Loading label={strings.loading} />
      ) : prompts.error ? (
        <Notice tone="danger">{errorText(prompts.error)}</Notice>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <Card title={t.versions}>
            <ul className="flex flex-col gap-1">
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(row.id);
                      setEditing(null);
                    }}
                    aria-current={selected?.id === row.id ? 'true' : undefined}
                    className={`flex w-full flex-col items-start gap-1 rounded-md px-3 py-2 text-left text-sm ${
                      selected?.id === row.id ? 'bg-primary-soft' : 'hover:bg-raised'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {t.version(row.version)}
                      {row.active ? <Badge tone="success">{t.active}</Badge> : null}
                    </span>
                    <span className="text-xs text-muted">
                      {bandLabel(row.grade_band)} · {formatDateTime(row.created_at)}
                    </span>
                    {row.notes ? <span className="text-xs text-muted">{row.notes}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <div className="flex min-w-0 flex-col gap-6">
            {editing ? (
              <PromptEditor
                key={editing.id}
                from={editing}
                versions={rows}
                onCreated={(id) => {
                  setSelectedId(id);
                  setEditing(null);
                }}
                onCancel={() => setEditing(null)}
              />
            ) : selected ? (
              <Card
                title={t.version(selected.version)}
                actions={
                  <div className="flex flex-wrap gap-2">
                    {!selected.active ? (
                      <Button
                        variant="primary"
                        disabled={activate.isPending}
                        onClick={() => activate.mutate(selected.id)}
                      >
                        {t.activate}
                      </Button>
                    ) : null}
                    <Button onClick={() => setEditing(selected)}>{t.newVersion}</Button>
                  </div>
                }
              >
                {activate.error ? <Notice tone="danger">{errorText(activate.error)}</Notice> : null}
                <p className="text-sm text-muted">
                  {t.band} : {bandLabel(selected.grade_band)}
                </p>
                <h3 className="font-medium">{t.system}</h3>
                <pre className="rounded-md bg-raised p-3 font-mono text-sm whitespace-pre-wrap">
                  {selected.system}
                </pre>
                <h3 className="font-medium">{t.user}</h3>
                <pre className="rounded-md bg-raised p-3 font-mono text-sm whitespace-pre-wrap">
                  {selected.user_template}
                </pre>
              </Card>
            ) : null}
            {!editing && selected ? (
              <PreviewPanel
                key={selected.id}
                system={selected.system}
                user={selected.user_template}
                version={selected.version}
                band={
                  (GRADE_BANDS.find((item) => item === selected.grade_band) ??
                    'cm1-cm2') as GradeBand
                }
              />
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
