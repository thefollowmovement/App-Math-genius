import { errorKind } from '@/data/errors';
import { useRecapPreferences, useSetRecapPreference } from '@/data/progress';
import { RecapSettings } from '@/screens/recap-settings';

export default function RecapSettingsRoute() {
  const preferences = useRecapPreferences();
  const change = useSetRecapPreference();
  return (
    <RecapSettings
      preferences={preferences.data}
      onChange={(key, value) => change.mutate({ key, value })}
      error={
        change.error
          ? errorKind(change.error)
          : preferences.error
            ? errorKind(preferences.error)
            : null
      }
    />
  );
}
