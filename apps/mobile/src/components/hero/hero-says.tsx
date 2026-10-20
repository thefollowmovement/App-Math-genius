import { heroLook, type HeroPose } from '@math-genius/shared';
import { ThemedText, View, cx } from '@math-genius/ui';
import type { ComponentProps } from 'react';

import { useChildHero } from './hero-context';
import { HeroView } from './hero-view';

type SpeechBubbleProps = {
  children: string;
  /** Who talks, when it is not the hero (its companion): named above the text. */
  speaker?: string;
  className?: string;
};

/** What the hero says, in a speech bubble whose sharp corner points at the hero (bottom left). */
export function SpeechBubble({ children, speaker, className }: SpeechBubbleProps) {
  return (
    <View
      className={cx(
        'rounded-lg rounded-bl-sm border-2 border-border bg-raised px-4 py-3',
        className,
      )}
    >
      {speaker ? (
        <ThemedText variant="label" tone="secondary">
          {speaker}
        </ThemedText>
      ) : null}
      <ThemedText>{children}</ThemedText>
    </View>
  );
}

type HeroSaysProps = {
  pose: Exclude<HeroPose, 'bust'>;
  size?: ComponentProps<typeof HeroView>['size'];
  children: string;
  /** Layout only. */
  className?: string;
};

/** The child's hero in a pose, and what it says. */
export function HeroSays({ pose, size = 'sm', children, className }: HeroSaysProps) {
  const avatar = useChildHero();
  return (
    <View className={cx('flex-row items-end gap-3', className)}>
      <HeroView look={heroLook(avatar)} pose={pose} size={size} />
      <SpeechBubble className="mb-2 flex-1">{children}</SpeechBubble>
    </View>
  );
}
