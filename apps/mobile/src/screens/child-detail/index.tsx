import { Button, Screen, ThemedText, View } from '@math-genius/ui';

import type { Child } from '@/data/children';
import type { PairedDevice } from '@/data/devices';
import type { SessionRow } from '@/data/family-sessions';
import type { ErrorKind } from '@/data/errors';
import { strings } from '@/i18n';

import { TodaySessions } from '../today-sessions';
import { PairingPanel, type PairingState } from './pairing-panel';

export type { PairingState };

const t = strings.childDetail;
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

type ChildDetailProps = {
  child: Child;
  /** The child's sessions today. */
  sessions: readonly SessionRow[];
  onOpenSession: (sessionId: string) => void;
  pairing: PairingState;
  creatingCode: boolean;
  pairingError: ErrorKind | null;
  onCreateCode: () => void;
  devices: PairedDevice[];
  revokingDeviceId: string | null;
  onRevokeDevice: (deviceId: string) => void;
};

export function ChildDetail({
  child,
  sessions,
  onOpenSession,
  pairing,
  creatingCode,
  pairingError,
  onCreateCode,
  devices,
  revokingDeviceId,
  onRevokeDevice,
}: ChildDetailProps) {
  return (
    <Screen>
      <ThemedText variant="caption">{strings.grades[child.grade]}</ThemedText>
      <TodaySessions sessions={sessions} onOpenSession={onOpenSession} />
      <PairingPanel
        pairing={pairing}
        creating={creatingCode}
        error={pairingError}
        onCreateCode={onCreateCode}
      />
      <View className="gap-3">
        <ThemedText variant="headline">{t.devicesTitle}</ThemedText>
        {devices.length === 0 ? <ThemedText variant="caption">{t.noDevices}</ThemedText> : null}
        {devices.map((device) => (
          <View
            key={device.id}
            className="flex-row items-center gap-4 rounded-lg border border-border bg-surface p-4"
          >
            <View className="flex-1 gap-1">
              <ThemedText variant="headline">{strings.platforms[device.platform]}</ThemedText>
              <ThemedText variant="caption">
                {t.pairedOn(dateFormat.format(new Date(device.paired_at)))}
              </ThemedText>
            </View>
            <Button
              variant="danger"
              title={t.revoke}
              loading={revokingDeviceId === device.id}
              onPress={() => onRevokeDevice(device.id)}
            />
          </View>
        ))}
      </View>
    </Screen>
  );
}
