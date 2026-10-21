import { Host, Switch } from '@expo/ui';
import { ActivityIndicator, Screen, ThemedText, View } from '@math-genius/ui';

import { ErrorMessage } from '@/components/error-message';
import type { ErrorKind } from '@/data/errors';
import type { RecapPreferences } from '@/data/progress';
import { strings } from '@/i18n';

const t = strings.recapSettings;

type RecapSettingsProps = {
  /** Missing while loading. */
  preferences?: RecapPreferences | null;
  onChange: (key: keyof RecapPreferences, value: boolean) => void;
  error: ErrorKind | null;
};

const GROUPS = [
  { title: t.weekly, hint: t.weeklyHint, push: 'weeklyPush', email: 'weeklyEmail' },
  { title: t.monthly, hint: t.monthlyHint, push: 'monthlyPush', email: 'monthlyEmail' },
] as const;

/** Each parent chooses how the weekly and monthly recaps reach them. */
export function RecapSettings({ preferences, onChange, error }: RecapSettingsProps) {
  return (
    <Screen>
      <ThemedText>{t.intro}</ThemedText>
      {!preferences ? (
        <View className="items-center gap-3" accessibilityLiveRegion="polite">
          <ActivityIndicator />
          <ThemedText variant="caption">{t.loading}</ThemedText>
        </View>
      ) : (
        GROUPS.map((group) => (
          <View key={group.title} className="gap-3 rounded-lg border border-border bg-surface p-4">
            <ThemedText variant="headline" accessibilityRole="header">
              {group.title}
            </ThemedText>
            <ThemedText variant="caption">{group.hint}</ThemedText>
            <Host matchContents={{ vertical: true }}>
              <Switch
                label={t.push}
                value={preferences[group.push]}
                onValueChange={(value) => onChange(group.push, value)}
                testID={group.push}
              />
            </Host>
            <Host matchContents={{ vertical: true }}>
              <Switch
                label={t.email}
                value={preferences[group.email]}
                onValueChange={(value) => onChange(group.email, value)}
                testID={group.email}
              />
            </Host>
          </View>
        ))
      )}
      <ErrorMessage kind={error} />
    </Screen>
  );
}
