'use client';

import { GRADE_BANDS, type GradeBand } from '@math-genius/shared';
import { useState } from 'react';

import { Button, Card, Notice, SelectField, TextArea, TextField } from '@/components/ui';
import { useCreatePrompt, type PromptRow } from '@/data/prompts';
import { strings } from '@/i18n/fr';
import { useAuth } from '@/lib/auth';
import { errorText } from '@/lib/errors';
import { nextVersion } from '@/models/preview';

import { PreviewPanel } from './preview-panel';

const t = strings.prompts;

/** A new version, written from an earlier one, tried live before it is created. */
export function PromptEditor({
  from,
  versions,
  onCreated,
  onCancel,
}: {
  from: PromptRow;
  versions: readonly PromptRow[];
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const auth = useAuth();
  const create = useCreatePrompt();
  const [band, setBand] = useState(from.grade_band ?? '');
  const [system, setSystem] = useState(from.system);
  const [user, setUser] = useState(from.user_template);
  const [notes, setNotes] = useState('');
  const version = nextVersion(versions);
  const ready = system.trim() !== '' && user.trim() !== '' && auth.status === 'signed-in';

  return (
    <>
      <Card title={t.version(version)}>
        <SelectField
          label={t.band}
          value={band}
          options={[
            { value: '', label: strings.allBands },
            ...GRADE_BANDS.map((item) => ({ value: item, label: strings.bands[item] })),
          ]}
          onChange={(event) => setBand(event.target.value)}
        />
        <TextArea
          label={t.system}
          rows={10}
          maxLength={8000}
          value={system}
          onChange={(event) => setSystem(event.target.value)}
        />
        <TextArea
          label={t.user}
          hint={t.variables}
          rows={8}
          maxLength={8000}
          value={user}
          onChange={(event) => setUser(event.target.value)}
        />
        <TextField
          label={t.notes}
          maxLength={500}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        {create.error ? <Notice tone="danger">{errorText(create.error)}</Notice> : null}
        <div className="flex gap-2">
          <Button
            variant="primary"
            disabled={!ready || create.isPending}
            onClick={() => {
              if (auth.status !== 'signed-in') return;
              create.mutate(
                {
                  version,
                  grade_band: band || null,
                  system,
                  user_template: user,
                  notes: notes.trim() || null,
                  created_by: auth.userId,
                },
                { onSuccess: onCreated },
              );
            }}
          >
            {create.isPending ? strings.saving : t.create}
          </Button>
          <Button onClick={onCancel}>{strings.cancel}</Button>
        </div>
      </Card>
      <PreviewPanel
        system={system}
        user={user}
        version={0}
        band={(GRADE_BANDS.find((item) => item === band) ?? 'cm1-cm2') as GradeBand}
      />
    </>
  );
}
