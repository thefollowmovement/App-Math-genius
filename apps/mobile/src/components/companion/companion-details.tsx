import { companionOf, companionStage, type CompanionId } from '@math-genius/shared';
import { ThemedText, View, cx } from '@math-genius/ui';
import type { ReactNode } from 'react';

import { strings } from '@/i18n';

import { CompanionPicture } from './companion-picture';
import { RarityTag } from './rarity-tag';

const t = strings.companions;

type CompanionDetailsProps = {
  companion: CompanionId;
  /** Below the description: whether the child has it, how to get it, an action. */
  children?: ReactNode;
  /** Layout only. */
  className?: string;
};

/** A companion's sheet: its full name, rarity, description and specialty. */
export function CompanionDetails({ companion, children, className }: CompanionDetailsProps) {
  const { fullName, description, specialty } = t.items[companion];
  const rarity = companionOf(companion)?.rarity ?? 'common';
  return (
    <View
      accessibilityLiveRegion="polite"
      className={cx('gap-3 rounded-lg border-2 border-border bg-raised p-4', className)}
    >
      <View className="flex-row items-center gap-3">
        <View className="size-24">
          <CompanionPicture companion={{ id: companion, stage: companionStage(companion) }} float />
        </View>
        <View className="flex-1 items-start gap-2">
          <RarityTag rarity={rarity} spoken />
          <ThemedText variant="headline" accessibilityRole="header">
            {fullName}
          </ThemedText>
        </View>
      </View>
      <ThemedText>{description}</ThemedText>
      <View className="gap-1">
        <ThemedText variant="label" tone="secondary">
          {t.specialty}
        </ThemedText>
        <ThemedText>{specialty}</ThemedText>
      </View>
      {children}
    </View>
  );
}
