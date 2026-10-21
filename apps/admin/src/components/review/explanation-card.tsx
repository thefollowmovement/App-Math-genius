'use client';

import type { GradeBand } from '@math-genius/shared';

import { Badge, Button } from '@/components/ui';
import type { ExplanationRow, ExplanationStatus } from '@/data/review';
import { strings } from '@/i18n/fr';
import { formatDateTime } from '@/models/dates';
import {
  EXPLANATION_PARTS,
  errorLabel,
  explanationExample,
  readExplanation,
  skillTitle,
} from '@/models/coach';

const t = strings.review;

/** One explanation: its template, the same on an example, how well it is understood. */
export function ExplanationCard({
  row,
  universe,
  busy,
  onReview,
}: {
  row: ExplanationRow;
  universe: string | null;
  busy: boolean;
  onReview: (status: ExplanationStatus) => void;
}) {
  const template = readExplanation(row.content);
  const example = template ? explanationExample(template, row.skill_code, row.error_type) : null;
  return (
    <article className="flex flex-col gap-3 rounded-md border border-border p-4">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{skillTitle(row.skill_code)}</h3>
        <Badge tone="primary">{errorLabel(row.error_type) ?? t.unclassified}</Badge>
        <Badge>{universe ?? t.everyday}</Badge>
        <Badge>{strings.bands[row.grade_band as GradeBand] ?? row.grade_band}</Badge>
        <span className="text-xs text-muted">
          {t.meta(row.model, row.prompt_version)} · {formatDateTime(row.created_at)}
        </span>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-muted">{t.template}</h4>
          {template
            ? EXPLANATION_PARTS.map((part) => (
                <p key={part} className="font-mono text-sm">
                  <span className="font-sans text-muted">{t.parts[part]} : </span>
                  {template[part]}
                </p>
              ))
            : null}
        </section>
        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-muted">{t.example}</h4>
          {example ? (
            <>
              <p className="text-sm text-muted">{example.exercise}</p>
              {EXPLANATION_PARTS.map((part) => (
                <p key={part}>
                  <span className="text-sm text-muted">{t.parts[part]} : </span>
                  {example.explanation[part]}
                </p>
              ))}
              {!example.showable ? <Badge tone="danger">{t.notShowable}</Badge> : null}
            </>
          ) : (
            <p className="text-sm text-muted">{t.noExample}</p>
          )}
        </section>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted">
          {t.understood(row.understood_count, row.shown_count)}
        </span>
        <div className="flex gap-2">
          {row.status !== 'approved' ? (
            <Button small variant="primary" disabled={busy} onClick={() => onReview('approved')}>
              {t.approve}
            </Button>
          ) : null}
          {row.status !== 'rejected' ? (
            <Button small variant="danger" disabled={busy} onClick={() => onReview('rejected')}>
              {t.reject}
            </Button>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
