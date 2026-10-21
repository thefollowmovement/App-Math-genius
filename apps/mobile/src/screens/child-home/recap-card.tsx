import type { Avatar, ChildHighlights } from '@math-genius/shared';
import { Button, ThemedText, View } from '@math-genius/ui';

import { HeroBust } from '@/components/hero/hero-bust';
import { SpeechBubble } from '@/components/hero/hero-says';
import { highlightsHeadline, highlightsTags, monthName } from '@/data/progress-model';
import { strings } from '@/i18n';
import { portraitLabel } from '@/i18n/cosmetic-names';

const t = strings.recapCard;

type RecapCardProps = {
  highlights: ChildHighlights;
  avatar: Avatar;
  onClose: () => void;
};

/**
 * The child's own recap at the start of a week or a month (docs/specs.md, côté enfant): what was
 * learnt and done, said by the hero, never what was missed.
 */
export function RecapCard({ highlights, avatar, onClose }: RecapCardProps) {
  const headline = highlightsHeadline(highlights);
  const title =
    highlights.kind === 'week' ? t.title.week : t.title.month(monthName(highlights.from));
  return (
    <View className="gap-3 rounded-lg border-2 border-secondary bg-surface p-4 glow-secondary">
      <View className="flex-row items-center justify-between gap-3">
        <ThemedText variant="label" tone="secondary">
          {t.label[highlights.kind]}
        </ThemedText>
        <ThemedText variant="caption">{title}</ThemedText>
      </View>
      <View className="flex-row items-end gap-3">
        <HeroBust avatar={avatar} size="md" label={portraitLabel(avatar)} />
        <SpeechBubble className="mb-2 flex-1">{headline}</SpeechBubble>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {highlightsTags(highlights).map((tag) => (
          <View key={tag} className="rounded-full border border-accent bg-raised px-3 py-1">
            <ThemedText variant="tag" tone="accent">
              {tag}
            </ThemedText>
          </View>
        ))}
      </View>
      <Button
        variant="secondary"
        title={t.close}
        accessibilityLabel={t.closeLabel}
        onPress={onClose}
      />
    </View>
  );
}
