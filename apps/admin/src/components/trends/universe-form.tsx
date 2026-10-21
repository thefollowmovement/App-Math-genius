'use client';

import { GRADES, type Grade } from '@math-genius/shared';
import { useState, type FormEvent } from 'react';

import { Button, Card, Checkbox, Notice, SelectField, TextArea, TextField } from '@/components/ui';
import { useSaveUniverse } from '@/data/universes';
import { strings } from '@/i18n/fr';
import { errorText } from '@/lib/errors';
import {
  CATEGORIES,
  PEGI,
  STATUSES,
  slugOf,
  universeProblems,
  universeRecord,
  type UniverseCategory,
  type UniverseDraft,
  type UniverseProblem,
  type UniverseStatus,
} from '@/models/universes';

const t = strings.trends;

/** Adds a reference to the catalogue, or edits one. */
export function UniverseForm({
  initial,
  isNew,
  onDone,
}: {
  initial: UniverseDraft;
  isNew: boolean;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [shown, setShown] = useState<UniverseProblem[]>([]);
  const save = useSaveUniverse();
  const set = (fields: Partial<UniverseDraft>) =>
    setDraft((current) => ({ ...current, ...fields }));
  const problem = (...codes: UniverseProblem[]) => {
    const code = codes.find((item) => shown.includes(item));
    return code ? t.problems[code] : null;
  };
  const toggleGrade = (grade: Grade, on: boolean) =>
    set({ grades: GRADES.filter((item) => (item === grade ? on : draft.grades.includes(item))) });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const problems = universeProblems(draft);
    setShown(problems);
    if (problems.length > 0) return;
    save.mutate({ record: universeRecord(draft), isNew }, { onSuccess: onDone });
  };

  return (
    <Card title={isNew ? t.form.titleNew : t.form.titleEdit(initial.name)}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={submit} noValidate>
        <TextField
          label={t.form.name}
          value={draft.name}
          maxLength={40}
          error={problem('name')}
          onChange={(event) =>
            set({
              name: event.target.value,
              ...(isNew ? { id: slugOf(event.target.value) } : {}),
            })
          }
        />
        <TextField
          label={t.form.id}
          hint={t.form.idHint}
          value={draft.id}
          disabled={!isNew}
          error={problem('id')}
          onChange={(event) => set({ id: event.target.value })}
        />
        <SelectField
          label={t.form.category}
          value={draft.category}
          options={CATEGORIES.map((value) => ({ value, label: strings.categories[value] }))}
          onChange={(event) => set({ category: event.target.value as UniverseCategory })}
        />
        <SelectField
          label={t.form.status}
          value={draft.status}
          options={STATUSES.map((value) => ({ value, label: strings.statuses[value] }))}
          onChange={(event) => set({ status: event.target.value as UniverseStatus })}
        />
        <fieldset className="flex flex-col gap-2 md:col-span-2">
          <legend className="text-sm font-medium">{t.form.grades}</legend>
          <div className="flex flex-wrap gap-4">
            {GRADES.map((grade) => (
              <Checkbox
                key={grade}
                label={grade}
                checked={draft.grades.includes(grade)}
                onChange={(on) => toggleGrade(grade, on)}
              />
            ))}
          </div>
          {problem('grades') ? <p className="text-sm text-danger">{problem('grades')}</p> : null}
        </fieldset>
        <SelectField
          label={t.form.pegi}
          hint={t.form.pegiHint}
          value={draft.pegi}
          error={problem('pegiBanned', 'pegi12')}
          options={[
            { value: '', label: strings.none },
            ...PEGI.map((value) => ({ value, label: `PEGI ${value}` })),
          ]}
          onChange={(event) => set({ pegi: event.target.value })}
        />
        <TextField
          label={t.form.review}
          type="date"
          value={draft.reviewAt}
          error={problem('review')}
          onChange={(event) => set({ reviewAt: event.target.value })}
        />
        <TextField
          label={t.form.words}
          hint={t.form.wordsHint}
          value={draft.words}
          onChange={(event) => set({ words: event.target.value })}
        />
        <TextArea
          label={t.form.images}
          hint={t.form.imagesHint}
          rows={3}
          value={draft.images}
          onChange={(event) => set({ images: event.target.value })}
        />
        {save.error ? (
          <div className="md:col-span-2">
            <Notice tone="danger">{errorText(save.error)}</Notice>
          </div>
        ) : null}
        <div className="flex gap-2 md:col-span-2">
          <Button variant="primary" type="submit" disabled={save.isPending}>
            {save.isPending ? strings.saving : strings.save}
          </Button>
          <Button onClick={onDone}>{strings.cancel}</Button>
        </div>
      </form>
    </Card>
  );
}
