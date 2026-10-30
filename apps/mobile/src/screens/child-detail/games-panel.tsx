import { Picker } from '@expo/ui';
import { GAME_MINUTES_CHOICES } from '@math-genius/shared';
import { ThemedText, View } from '@math-genius/ui';

import { PickerField } from '@/components/picker-field';
import type { ErrorKind } from '@/data/errors';
import { strings } from '@/i18n';

const t = strings.games.parent;

export type GamesPanelState = {
  /** The child's daily limit, in minutes (0: no games). */
  limitMinutes: number;
  /** Today, from the server; missing while loading. */
  today?: { playedMinutes: number; gems: number; gemsCap: number };
  saving: boolean;
  error: ErrorKind | null;
  onChangeLimit: (minutes: number) => void;
};

/** The mini-games: how long the child may play each day, and what today's games gave. */
export function GamesPanel({ limitMinutes, today, saving, error, onChangeLimit }: GamesPanelState) {
  // A limit set elsewhere (up to 2 hours) stays in the list.
  const usual: readonly number[] = GAME_MINUTES_CHOICES;
  const choices = usual.includes(limitMinutes)
    ? usual
    : [...usual, limitMinutes].sort((a, b) => a - b);
  return (
    <View className="gap-4">
      <View className="gap-1">
        <ThemedText variant="headline" accessibilityRole="header">
          {t.title}
        </ThemedText>
        <ThemedText variant="caption">{t.intro}</ThemedText>
      </View>
      <View className="gap-3 rounded-lg border border-border bg-surface p-4">
        <PickerField label={t.limit} hint={saving ? t.saving : undefined}>
          <Picker<string>
            selectedValue={String(limitMinutes)}
            onValueChange={(value) => {
              const minutes = Number(value);
              if (minutes !== limitMinutes) onChangeLimit(minutes);
            }}
            testID="game-limit"
          >
            {choices.map((minutes) => (
              <Picker.Item key={minutes} label={t.choice(minutes)} value={String(minutes)} />
            ))}
          </Picker>
        </PickerField>
        {today && limitMinutes > 0 ? (
          <View className="gap-1">
            <ThemedText>{t.today(today.playedMinutes, limitMinutes)}</ThemedText>
            <ThemedText variant="caption">{t.gems(today.gems, today.gemsCap)}</ThemedText>
          </View>
        ) : null}
        {error ? (
          <ThemedText tone="danger" accessibilityLiveRegion="polite">
            {strings.errors[error]}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}
