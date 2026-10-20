import type { Explanation } from '@math-genius/exercise-engine';
import { Button, ThemedText, View } from '@math-genius/ui';

import { strings } from '@/i18n';

const t = strings.practice.coach;

/** The coach after a wrong answer: looking for an explanation, or showing one. */
export type CoachView =
  | { status: 'thinking' }
  | {
      status: 'shown';
      explanation: Explanation;
      /** « Explique autrement » may find another one. */
      more: boolean;
    };

type CoachBubbleProps = {
  explanation: Explanation;
  /** The child's hero, who presents it. */
  hero: string;
  more: boolean;
  onUnderstood: () => void;
  onExplainAgain: () => void;
};

/** The coach's explanation in three parts, in the hero's speech bubble (its corner points at it). */
export function CoachBubble({
  explanation,
  hero,
  more,
  onUnderstood,
  onExplainAgain,
}: CoachBubbleProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      className="gap-3 rounded-lg rounded-bl-sm border-2 border-secondary bg-raised p-4"
    >
      <ThemedText variant="label" tone="secondary" accessibilityRole="header">
        {t.title(hero)}
      </ThemedText>
      <Part label={t.what}>{explanation.what}</Part>
      <Part label={t.image}>{explanation.image}</Part>
      <Part label={t.tip} tip>
        {explanation.tip}
      </Part>
      <View className="flex-row flex-wrap gap-2">
        <Button variant="success" title={t.understood} onPress={onUnderstood} className="grow" />
        {more ? (
          <Button variant="outline" title={t.again} onPress={onExplainAgain} className="grow" />
        ) : null}
      </View>
      {more ? null : (
        <ThemedText variant="caption" tone="muted">
          {t.noOther}
        </ThemedText>
      )}
    </View>
  );
}

function Part({
  label,
  children,
  tip = false,
}: {
  label: string;
  children: string;
  tip?: boolean;
}) {
  return (
    <View className="gap-1">
      <ThemedText variant="label" tone={tip ? 'accent' : 'muted'}>
        {label}
      </ThemedText>
      <ThemedText variant={tip ? 'headline' : 'body'}>{children}</ThemedText>
    </View>
  );
}
