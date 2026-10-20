import { getSkill } from '@math-genius/curriculum';
import type { StrandLevel } from '@math-genius/exercise-engine';
import type { Grade } from '@math-genius/shared';
import { ThemedText, View } from '@math-genius/ui';
import type { ComponentProps } from 'react';

import type { PlacementReport } from '@/data/placement-report';
import { strings } from '@/i18n';

const t = strings.childDetail.placement;
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

const TONES: Record<StrandLevel, NonNullable<ComponentProps<typeof ThemedText>['tone']>> = {
  ahead: 'success',
  on_track: 'secondary',
  to_consolidate: 'fire',
};

type PlacementPanelProps = {
  /** Missing while loading. */
  report?: PlacementReport;
  /** The child's grade now: a test taken in another grade is said so. */
  grade: Grade;
  /** The grade has exercises to place the child with. */
  available: boolean;
};

/**
 * The placement test's result (docs/specs.md, Résultat parent): a level per strand of the
 * referential and the three priorities, read again from the answers.
 */
export function PlacementPanel({ report, grade, available }: PlacementPanelProps) {
  const last = report?.last ?? null;
  return (
    <View className="gap-3">
      <ThemedText variant="headline" accessibilityRole="header">
        {t.title}
      </ThemedText>
      {report?.inProgress ? <ThemedText variant="caption">{t.inProgress}</ThemedText> : null}
      {!last ? (
        report && !report.inProgress ? (
          <ThemedText>{available ? t.none : t.unavailable}</ThemedText>
        ) : null
      ) : (
        <>
          <ThemedText variant="caption">
            {t.takenOn(dateFormat.format(new Date(last.takenAt)), strings.grades[last.grade])}
          </ThemedText>
          {last.grade !== grade ? (
            <ThemedText variant="caption">{t.gradeChanged(strings.grades[last.grade])}</ThemedText>
          ) : null}
          <View className="gap-2 rounded-lg border border-border bg-surface p-4">
            {last.strands.map(({ strand, level }) => (
              <View key={strand} className="flex-row items-center justify-between gap-3">
                <ThemedText className="flex-1">{strings.placement.strands[strand]}</ThemedText>
                <ThemedText variant="label" tone={level ? TONES[level] : 'muted'}>
                  {level ? t.levels[level] : t.untested}
                </ThemedText>
              </View>
            ))}
          </View>
          <ThemedText variant="label" tone="secondary">
            {t.priorities}
          </ThemedText>
          {last.priorities.length === 0 ? (
            <ThemedText>{t.noPriority}</ThemedText>
          ) : (
            <View className="gap-1">
              {last.priorities.map((code, index) => (
                <ThemedText key={code}>{`${index + 1}. ${getSkill(code).title}`}</ThemedText>
              ))}
            </View>
          )}
          <ThemedText variant="caption">{t.recheck}</ThemedText>
        </>
      )}
    </View>
  );
}
