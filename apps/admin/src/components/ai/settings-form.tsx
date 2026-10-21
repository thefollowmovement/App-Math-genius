'use client';

import { useState, type FormEvent } from 'react';

import { Button, Card, Checkbox, Notice, SelectField, TextField } from '@/components/ui';
import { useUpdateAiSettings } from '@/data/ai';
import { strings } from '@/i18n/fr';
import { errorText } from '@/lib/errors';
import {
  PROVIDER_KINDS,
  emptyProvider,
  settingsProblems,
  settingsUpdate,
  type ProviderDraft,
  type ProviderKind,
  type SettingsDraft,
  type SettingsProblem,
} from '@/models/ai-settings';

const t = strings.ai;

/** Providers, moderation, caps and the night's batch; the super-admin edits them. */
export function SettingsForm({
  initial,
  editable,
  saved,
  onSaved,
}: {
  initial: SettingsDraft;
  editable: boolean;
  /** Kept by the page: saving reloads the settings and starts the form again. */
  saved: boolean;
  onSaved: (saved: boolean) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [shown, setShown] = useState<SettingsProblem[]>([]);
  const update = useUpdateAiSettings();
  const set = (fields: Partial<SettingsDraft>) => {
    onSaved(false);
    setDraft((current) => ({ ...current, ...fields }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const problems = settingsProblems(draft);
    setShown(problems);
    if (problems.length === 0) {
      update.mutate(settingsUpdate(draft), { onSuccess: () => onSaved(true) });
    }
  };
  const problem = (code: SettingsProblem, text: string) => (shown.includes(code) ? text : null);

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      <fieldset disabled={!editable} className="flex flex-col gap-6">
        <Card title={t.realtime}>
          <ProviderFields
            prefix="realtime"
            value={draft.realtime}
            problem={problem}
            onChange={(realtime) => set({ realtime })}
          />
          <Checkbox
            label={t.moderation}
            checked={draft.moderation}
            disabled={!editable}
            onChange={(moderation) => set({ moderation })}
          />
        </Card>
        <Card title={t.night}>
          <p className="text-sm text-muted">{t.nightHint}</p>
          <SelectField
            label={t.kind}
            value={draft.night?.kind ?? ''}
            options={[
              { value: '', label: t.nightNone },
              ...PROVIDER_KINDS.map((kind) => ({ value: kind, label: t.kinds[kind] })),
            ]}
            onChange={(event) =>
              set({
                night: event.target.value
                  ? emptyProvider(event.target.value as ProviderKind)
                  : null,
              })
            }
          />
          {draft.night ? (
            <ProviderFields
              prefix="night"
              value={draft.night}
              problem={problem}
              hideKind
              onChange={(night) => set({ night })}
            />
          ) : null}
          <TextField
            label={t.nightBatch}
            inputMode="numeric"
            value={draft.nightBatch}
            error={problem('nightBatch', t.problems.batch)}
            onChange={(event) => set({ nightBatch: event.target.value })}
          />
        </Card>
        <Card title={t.caps}>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label={t.dailyCap}
              inputMode="decimal"
              value={draft.dailyCap}
              error={problem('dailyCap', t.problems.cap)}
              onChange={(event) => set({ dailyCap: event.target.value })}
            />
            <TextField
              label={t.monthlyCap}
              inputMode="decimal"
              value={draft.monthlyCap}
              error={problem('monthlyCap', t.problems.cap)}
              onChange={(event) => set({ monthlyCap: event.target.value })}
            />
          </div>
        </Card>
      </fieldset>
      {update.error ? <Notice tone="danger">{errorText(update.error)}</Notice> : null}
      {saved ? <Notice tone="success">{strings.saved}</Notice> : null}
      {editable ? (
        <div>
          <Button variant="primary" type="submit" disabled={update.isPending}>
            {update.isPending ? strings.saving : strings.save}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function ProviderFields({
  prefix,
  value,
  problem,
  hideKind = false,
  onChange,
}: {
  prefix: 'realtime' | 'night';
  value: ProviderDraft;
  problem: (code: SettingsProblem, text: string) => string | null;
  hideKind?: boolean;
  onChange: (value: ProviderDraft) => void;
}) {
  const set = (fields: Partial<ProviderDraft>) => onChange({ ...value, ...fields });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {hideKind ? null : (
        <SelectField
          label={t.kind}
          value={value.kind}
          options={PROVIDER_KINDS.map((kind) => ({ value: kind, label: t.kinds[kind] }))}
          onChange={(event) => onChange(emptyProvider(event.target.value as ProviderKind))}
        />
      )}
      <TextField
        label={t.baseUrl}
        value={value.baseUrl}
        error={problem(`${prefix}.url`, t.problems.url)}
        onChange={(event) => set({ baseUrl: event.target.value })}
      />
      <TextField
        label={t.model}
        value={value.model}
        error={problem(`${prefix}.model`, t.problems.model)}
        onChange={(event) => set({ model: event.target.value })}
      />
      <TextField
        label={t.priceIn}
        inputMode="decimal"
        value={value.priceIn}
        error={problem(`${prefix}.price`, t.problems.price)}
        onChange={(event) => set({ priceIn: event.target.value })}
      />
      <TextField
        label={t.priceOut}
        inputMode="decimal"
        value={value.priceOut}
        onChange={(event) => set({ priceOut: event.target.value })}
      />
    </div>
  );
}
