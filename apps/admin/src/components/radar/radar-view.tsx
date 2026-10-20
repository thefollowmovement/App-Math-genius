'use client';

import { GRADE_BANDS, type GradeBand } from '@math-genius/shared';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Badge, Button, Card, Loading, Notice, PageHeader, Table, Td, Th } from '@/components/ui';
import { useQuestions } from '@/data/questionnaire';
import { useInterestCounts, useOtherAnswers, useReviewOthers } from '@/data/radar';
import { useUniverses } from '@/data/universes';
import { strings } from '@/i18n/fr';
import { useAuth } from '@/lib/auth';
import { errorText } from '@/lib/errors';
import { canSee } from '@/models/navigation';
import { monthsBack, otherGroups, radarGrid } from '@/models/radar';

import { Heatmap } from './heatmap';

const t = strings.radar;
const MONTHS = 6;

export function RadarView() {
  const auth = useAuth();
  const [band, setBand] = useState<GradeBand | null>(null);
  const counts = useInterestCounts(MONTHS);
  const universes = useUniverses();
  const questions = useQuestions();
  const others = useOtherAnswers();
  const review = useReviewOthers();
  const canAdd = auth.status === 'signed-in' && canSee(auth.role, 'tendances');

  const grid = useMemo(
    () =>
      radarGrid(counts.data ?? [], {
        band,
        months: monthsBack(new Date(), MONTHS),
        names: new Map((universes.data ?? []).map((row) => [row.id, row.name])),
      }),
    [counts.data, universes.data, band],
  );
  const groups = useMemo(() => otherGroups(others.data ?? []), [others.data]);
  const questionOf = (id: string) => questions.data?.find((question) => question.id === id);

  return (
    <>
      <PageHeader title={strings.pages.radar} intro={t.intro} />
      <Card>
        <div className="flex flex-wrap gap-2" role="group" aria-label={strings.allBands}>
          {[null, ...GRADE_BANDS].map((item) => (
            <Button
              key={item ?? 'all'}
              small
              variant={band === item ? 'primary' : 'secondary'}
              aria-pressed={band === item}
              onClick={() => setBand(item)}
            >
              {item ? strings.bands[item] : strings.allBands}
            </Button>
          ))}
        </div>
        {counts.isPending ? (
          <Loading label={strings.loading} />
        ) : counts.error ? (
          <Notice tone="danger">{errorText(counts.error)}</Notice>
        ) : (
          <Heatmap
            grid={grid}
            title={t.chartTitle(band ? strings.bands[band] : strings.allBands)}
          />
        )}
      </Card>

      <Card title={t.others}>
        {review.error ? <Notice tone="danger">{errorText(review.error)}</Notice> : null}
        {others.isPending ? (
          <Loading label={strings.loading} />
        ) : others.error ? (
          <Notice tone="danger">{errorText(others.error)}</Notice>
        ) : groups.length === 0 ? (
          <p className="text-muted">{t.othersEmpty}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t.answer}</Th>
                <Th numeric>{t.count}</Th>
                <Th>{t.question}</Th>
                <Th>{t.bands}</Th>
                <Th>{strings.trends.columns.actions}</Th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const question = questionOf(group.questionId);
                return (
                  <tr key={group.key}>
                    <Td className="font-medium">{group.answer}</Td>
                    <Td numeric>{group.count}</Td>
                    <Td>{question?.title ?? group.questionId}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {group.bands.map((item) => (
                          <Badge key={item}>
                            {item in strings.bands ? strings.bands[item as GradeBand] : item}
                          </Badge>
                        ))}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          small
                          variant="primary"
                          disabled={review.isPending}
                          onClick={() => review.mutate({ ids: group.ids, status: 'approved' })}
                        >
                          {t.approve}
                        </Button>
                        <Button
                          small
                          variant="danger"
                          disabled={review.isPending}
                          onClick={() => review.mutate({ ids: group.ids, status: 'rejected' })}
                        >
                          {t.reject}
                        </Button>
                        {canAdd ? (
                          <Link
                            className="rounded-md px-2.5 py-1 text-sm text-primary hover:bg-primary-soft"
                            href={{
                              pathname: '/tendances',
                              query: {
                                nouveau: group.answer,
                                ...(question ? { categorie: question.category } : {}),
                              },
                            }}
                          >
                            {t.addToCatalog}
                          </Link>
                        ) : null}
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
