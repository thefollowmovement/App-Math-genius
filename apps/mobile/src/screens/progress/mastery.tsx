import type { DomainMastery, Grade, SkillState } from '@math-genius/shared';
import { ThemedText, View } from '@math-genius/ui';

import { ProgressBar } from '@/components/game/progress-bar';
import { SKILL_LISTS, skillGroups } from '@/data/progress-model';
import { strings } from '@/i18n';

const t = strings.progress;

/** Mastery of the grade's programme by domain, in bars. */
export function DomainBars({
  domains,
  grade,
}: {
  domains: readonly DomainMastery[];
  grade: Grade;
}) {
  return (
    <View className="gap-3">
      <ThemedText variant="headline" accessibilityRole="header">
        {t.domains.title}
      </ThemedText>
      {domains.length === 0 ? (
        <ThemedText variant="caption">{t.domains.none}</ThemedText>
      ) : (
        <View className="gap-4 rounded-lg border border-border bg-surface p-4">
          <ThemedText variant="caption">{t.domains.hint(strings.grades[grade])}</ThemedText>
          {domains.map((domain) => (
            <View key={domain.domain} className="gap-2">
              <View className="flex-row items-baseline justify-between gap-3">
                <ThemedText className="flex-1">{t.domains.names[domain.domain]}</ThemedText>
                <ThemedText variant="tag" tone="primary">
                  {t.domains.percent(domain.value)}
                </ThemedText>
              </View>
              <ProgressBar
                value={domain.value / 100}
                fill="primary"
                size="sm"
                label={t.domains.names[domain.domain]}
                valueText={t.domains.value(domain.value, domain.mastered, domain.total)}
              />
              <ThemedText variant="caption">
                {t.domains.mastered(domain.mastered, domain.total)}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const TONES = { mastered: 'success', in_progress: 'secondary', to_consolidate: 'fire' } as const;

/** The skills mastered, in progress and to consolidate. */
export function SkillLists({ skills }: { skills: readonly SkillState[] }) {
  const groups = skillGroups(skills);
  return (
    <View className="gap-3">
      <ThemedText variant="headline" accessibilityRole="header">
        {t.skills.title}
      </ThemedText>
      {SKILL_LISTS.map((list) => (
        <View key={list} className="gap-2 rounded-lg border border-border bg-surface p-4">
          <ThemedText variant="label" tone={TONES[list]}>
            {`${t.skills.lists[list]} (${groups[list].length})`}
          </ThemedText>
          {groups[list].length === 0 ? (
            <ThemedText variant="caption">{t.skills.empty}</ThemedText>
          ) : (
            groups[list].map((skill) => (
              <View key={skill.code} className="flex-row items-baseline gap-3">
                <ThemedText className="flex-1">{skill.title}</ThemedText>
                <ThemedText variant="caption">
                  {`${strings.grades[skill.grade]} · ${t.skills.mastery(skill.mastery)}`}
                </ThemedText>
              </View>
            ))
          )}
        </View>
      ))}
    </View>
  );
}
