'use client';

import { useMemo, useState } from 'react';

import { Button, Card, Loading, Notice, PageHeader } from '@/components/ui';
import { useExplanations, useReviewExplanation, type ExplanationStatus } from '@/data/review';
import { useUniverses } from '@/data/universes';
import { strings } from '@/i18n/fr';
import { errorText } from '@/lib/errors';
import { understoodRate } from '@/models/coach';

import { BannedWords } from './banned-words';
import { ExplanationCard } from './explanation-card';
import { ModerationLog } from './moderation-log';

const t = strings.review;
const TABS: readonly ExplanationStatus[] = ['pending', 'approved', 'rejected'];

export function ReviewView() {
  const [tab, setTab] = useState<ExplanationStatus>('pending');
  const explanations = useExplanations(tab);
  const universes = useUniverses();
  const review = useReviewExplanation();
  const names = useMemo(
    () => new Map((universes.data ?? []).map((row) => [row.id, row.name])),
    [universes.data],
  );
  // Validated explanations: the best understood first.
  const rows = useMemo(() => {
    const list = [...(explanations.data ?? [])];
    if (tab === 'approved') {
      list.sort(
        (a, b) =>
          (understoodRate(b.understood_count, b.shown_count) ?? -1) -
          (understoodRate(a.understood_count, a.shown_count) ?? -1),
      );
    }
    return list;
  }, [explanations.data, tab]);

  return (
    <>
      <PageHeader title={strings.pages.relecture} intro={t.intro} />
      <Card>
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((item) => (
            <Button
              key={item}
              small
              role="tab"
              aria-selected={tab === item}
              variant={tab === item ? 'primary' : 'secondary'}
              onClick={() => setTab(item)}
            >
              {t.tabs[item]}
            </Button>
          ))}
        </div>
        {review.error ? <Notice tone="danger">{errorText(review.error)}</Notice> : null}
        {explanations.isPending ? (
          <Loading label={strings.loading} />
        ) : explanations.error ? (
          <Notice tone="danger">{errorText(explanations.error)}</Notice>
        ) : rows.length === 0 ? (
          <p className="text-muted">{t.empty}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {rows.map((row) => (
              <ExplanationCard
                key={row.id}
                row={row}
                universe={row.universe_id ? (names.get(row.universe_id) ?? row.universe_id) : null}
                busy={review.isPending}
                onReview={(status) => review.mutate({ id: row.id, status })}
              />
            ))}
          </div>
        )}
      </Card>
      <BannedWords />
      <ModerationLog />
    </>
  );
}
