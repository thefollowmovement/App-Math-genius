'use client';

import type { SkillCode } from '@math-genius/curriculum';
import { GRADE_BANDS, type GradeBand } from '@math-genius/shared';
import { useMemo, useState } from 'react';

import { Button, Card, Checkbox, Notice, SelectField } from '@/components/ui';
import { usePreview } from '@/data/prompts';
import { useUniverses } from '@/data/universes';
import { strings } from '@/i18n/fr';
import { errorText } from '@/lib/errors';
import { EXPLANATION_PARTS, coachSkills, skillErrors } from '@/models/coach';
import { previewView } from '@/models/preview';

const t = strings.prompts.test;

/** « Test en direct »: the prompt being written, on an exercise that shows the chosen mistake. */
export function PreviewPanel({
  system,
  user,
  version,
  band: initialBand,
}: {
  system: string;
  user: string;
  version: number;
  band: GradeBand;
}) {
  const skills = useMemo(() => coachSkills(), []);
  const universes = useUniverses();
  const preview = usePreview();
  const [skill, setSkill] = useState<SkillCode>(skills[0]?.code ?? 'ce2.addition-posee');
  const errors = skillErrors(skill);
  const [error, setError] = useState<string>(errors[0]?.code ?? '');
  const [universe, setUniverse] = useState('');
  const [band, setBand] = useState<GradeBand>(initialBand);
  const [night, setNight] = useState(false);
  const view = preview.data === undefined ? null : previewView(preview.data);

  return (
    <Card title={t.title}>
      <p className="text-sm text-muted">{t.intro}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label={t.skill}
          value={skill}
          options={skills.map((item) => ({ value: item.code, label: item.title }))}
          onChange={(event) => {
            const next = event.target.value as SkillCode;
            setSkill(next);
            setError(skillErrors(next)[0]?.code ?? '');
          }}
        />
        <SelectField
          label={t.error}
          value={error}
          options={[
            ...errors.map((item) => ({ value: item.code, label: item.label })),
            { value: '', label: t.anyError },
          ]}
          onChange={(event) => setError(event.target.value)}
        />
        <SelectField
          label={t.universe}
          value={universe}
          options={[
            { value: '', label: t.everyday },
            ...(universes.data ?? [])
              .filter((row) => row.status !== 'retired')
              .map((row) => ({ value: row.id, label: row.name })),
          ]}
          onChange={(event) => setUniverse(event.target.value)}
        />
        <SelectField
          label={strings.prompts.band}
          value={band}
          options={GRADE_BANDS.map((item) => ({ value: item, label: strings.bands[item] }))}
          onChange={(event) => setBand(event.target.value as GradeBand)}
        />
      </div>
      <Checkbox label={t.night} checked={night} onChange={setNight} />
      <div>
        <Button
          variant="primary"
          disabled={preview.isPending || !system.trim() || !user.trim()}
          onClick={() =>
            preview.mutate({
              skill,
              error: error || null,
              universe: universe || null,
              band,
              system,
              user,
              version,
              night,
            })
          }
        >
          {preview.isPending ? t.running : t.run}
        </Button>
      </div>
      {preview.error ? <Notice tone="danger">{errorText(preview.error)}</Notice> : null}
      {view?.kind === 'refused-request' ? (
        <Notice tone="warning">
          {view.reason in t.reasons
            ? t.reasons[view.reason as keyof typeof t.reasons]
            : view.reason}
        </Notice>
      ) : null}
      {view?.kind === 'done' ? (
        <div className="flex flex-col gap-3">
          <dl className="grid gap-2 text-sm md:grid-cols-[10rem_1fr]">
            <dt className="text-muted">{t.exercise}</dt>
            <dd>{view.exercise}</dd>
            <dt className="text-muted">{t.given}</dt>
            <dd>{view.given}</dd>
            <dt className="text-muted">{t.solution}</dt>
            <dd>{view.solution}</dd>
          </dl>
          {view.shown ? (
            <div className="flex flex-col gap-2 rounded-md border border-success p-4">
              <p className="text-sm font-medium text-success">{t.shown}</p>
              {EXPLANATION_PARTS.map((part) => (
                <p key={part}>
                  <span className="text-sm text-muted">{strings.review.parts[part]} : </span>
                  {view.shown?.[part]}
                </p>
              ))}
            </div>
          ) : view.raw === null ? (
            <Notice tone="danger">{t.failed}</Notice>
          ) : (
            <Notice tone="warning">
              {t.refused(
                view.problems.map((code) => strings.review.problems[code] ?? code).join(', '),
              )}
            </Notice>
          )}
          {view.raw !== null ? (
            <details>
              <summary className="cursor-pointer text-sm text-muted">{t.raw}</summary>
              <pre className="mt-2 rounded-md bg-raised p-3 font-mono text-xs whitespace-pre-wrap">
                {view.raw}
              </pre>
            </details>
          ) : null}
          <p className="text-xs text-muted">{t.cost(view.tokens, view.latencyMs)}</p>
        </div>
      ) : null}
    </Card>
  );
}
