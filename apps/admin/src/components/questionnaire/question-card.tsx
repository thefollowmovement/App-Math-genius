'use client';

import { useState } from 'react';

import { Badge, Button, Card, Checkbox, Notice, SelectField, TextField } from '@/components/ui';
import {
  useSaveOptions,
  useUpdateQuestion,
  type OptionRow,
  type QuestionRow,
} from '@/data/questionnaire';
import { strings } from '@/i18n/fr';
import { errorText } from '@/lib/errors';
import { moved } from '@/models/order';
import { gradesLabel, type UniverseRow } from '@/models/universes';

const t = strings.questionnaire;

/** One question of « Ton univers »: its title, whether it is asked, and its choices in order. */
export function QuestionCard({
  question,
  options,
  universes,
  first,
  last,
  onMove,
}: {
  question: QuestionRow;
  options: OptionRow[];
  universes: UniverseRow[];
  first: boolean;
  last: boolean;
  onMove: (step: -1 | 1) => void;
}) {
  const [title, setTitle] = useState(question.title);
  const [adding, setAdding] = useState({ universe: '', icon: '' });
  const update = useUpdateQuestion();
  const save = useSaveOptions();
  const nameOf = (id: string) => universes.find((row) => row.id === id);
  const choosable = universes
    .filter((row) => row.status !== 'retired' && !options.some((o) => o.universe_id === row.id))
    .sort(
      (a, b) =>
        Number(b.category === question.category) - Number(a.category === question.category) ||
        a.name.localeCompare(b.name),
    );

  const write = (next: { universe_id: string; icon: string }[], removed: string[] = []) =>
    save.mutate({ questionId: question.id, options: next, removed });
  const current = options.map(({ universe_id, icon }) => ({ universe_id, icon }));

  return (
    <Card
      title={question.title}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={question.active ? 'success' : 'neutral'}>
            {question.active ? t.active : t.inactive}
          </Badge>
          <Button small disabled={first} onClick={() => onMove(-1)} aria-label={t.up}>
            ↑
          </Button>
          <Button small disabled={last} onClick={() => onMove(1)} aria-label={t.down}>
            ↓
          </Button>
        </div>
      }
    >
      {update.error || save.error ? (
        <Notice tone="danger">{errorText(update.error ?? save.error)}</Notice>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <TextField
            label={t.title}
            value={title}
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <Button
          disabled={title.trim() === question.title || title.trim() === '' || update.isPending}
          onClick={() => update.mutate({ id: question.id, fields: { title: title.trim() } })}
        >
          {strings.save}
        </Button>
        <Checkbox
          label={t.active}
          checked={question.active}
          onChange={(active) => update.mutate({ id: question.id, fields: { active } })}
        />
      </div>
      <p className="text-sm text-muted">
        {strings.categories[question.category]} · {t.grades} : {gradesLabel(question.grades)}
        {question.other_grades.length > 0
          ? ` · ${t.other} ${gradesLabel(question.other_grades)}`
          : ''}
      </p>

      <h3 className="font-medium">{t.options}</h3>
      {options.length === 0 ? <p className="text-muted">{t.noOptions}</p> : null}
      <ol className="flex flex-col gap-1">
        {options.map((option, index) => {
          const universe = nameOf(option.universe_id);
          return (
            <li
              key={option.universe_id}
              className="flex items-center gap-3 rounded-md bg-raised px-3 py-1.5"
            >
              <span aria-hidden className="text-xl">
                {option.icon}
              </span>
              <span className="flex-1">
                {universe?.name ?? option.universe_id}
                {universe && universe.status !== 'active' ? (
                  <span className="ml-2">
                    <Badge tone={universe.status === 'testing' ? 'primary' : 'neutral'}>
                      {strings.statuses[universe.status]}
                    </Badge>
                  </span>
                ) : null}
              </span>
              <Button
                small
                variant="ghost"
                disabled={index === 0 || save.isPending}
                aria-label={`${t.up} : ${universe?.name ?? option.universe_id}`}
                onClick={() => write(moved(current, index, -1))}
              >
                ↑
              </Button>
              <Button
                small
                variant="ghost"
                disabled={index === options.length - 1 || save.isPending}
                aria-label={`${t.down} : ${universe?.name ?? option.universe_id}`}
                onClick={() => write(moved(current, index, 1))}
              >
                ↓
              </Button>
              <Button
                small
                variant="danger"
                disabled={save.isPending}
                onClick={() =>
                  write(
                    current.filter((item) => item.universe_id !== option.universe_id),
                    [option.universe_id],
                  )
                }
              >
                {strings.remove}
              </Button>
            </li>
          );
        })}
      </ol>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!adding.universe || !adding.icon.trim()) return;
          write([...current, { universe_id: adding.universe, icon: adding.icon.trim() }]);
          setAdding({ universe: '', icon: '' });
        }}
      >
        <div className="min-w-56 flex-1">
          <SelectField
            label={t.universe}
            value={adding.universe}
            options={[
              { value: '', label: t.pick },
              ...choosable.map((row) => ({
                value: row.id,
                label: `${row.name} (${strings.categories[row.category]})`,
              })),
            ]}
            onChange={(event) => setAdding({ ...adding, universe: event.target.value })}
          />
        </div>
        <div className="w-56">
          <TextField
            label={t.icon}
            value={adding.icon}
            maxLength={16}
            onChange={(event) => setAdding({ ...adding, icon: event.target.value })}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={!adding.universe || !adding.icon.trim() || save.isPending}
        >
          {t.addOption}
        </Button>
      </form>
    </Card>
  );
}
