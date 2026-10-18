import type { Routine } from '@math-genius/shared';
import { Button, Screen, ThemedText, View } from '@math-genius/ui';

import type { Child } from '@/data/children';
import type { PairedDevice } from '@/data/devices';
import type { SessionRow } from '@/data/family-sessions';
import type { ErrorKind } from '@/data/errors';
import type { ProgressView } from '@/data/rewards-model';
import type { VacationRow } from '@/data/routine-plan';
import { strings } from '@/i18n';

import { TodaySessions } from '../today-sessions';
import { NudgePanel, type NudgeResult } from './nudge-panel';
import { PairingPanel, type PairingState } from './pairing-panel';
import { RewardsPanel, type ParentRewardsState } from './rewards-panel';
import { RoutinePanel } from './routine-panel';

export type { NudgeResult, PairingState, ParentRewardsState };

export type NudgeState = {
  onSend: (message: string) => void;
  sending: boolean;
  result: NudgeResult;
  error: ErrorKind | null;
};

const t = strings.childDetail;
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

type ChildDetailProps = {
  child: Child;
  /** Streak, level and gems; missing while loading. */
  progress?: ProgressView;
  /** Badges earned. */
  badges?: number;
  /** The child's sessions today. */
  sessions: readonly SessionRow[];
  onOpenSession: (sessionId: string) => void;
  routine: Routine | null;
  /** Current and coming holidays. */
  vacations: readonly VacationRow[];
  onEditRoutine: () => void;
  /** Real-life rewards set by the parent. */
  rewards: ParentRewardsState;
  /** Messages to the child, once a device is paired. */
  nudge: NudgeState;
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
  progress,
  badges = 0,
  sessions,
  onOpenSession,
  routine,
  vacations,
  onEditRoutine,
  rewards,
  nudge,
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
      <View className="gap-1">
        <ThemedText variant="caption">{strings.grades[child.grade]}</ThemedText>
        {progress ? (
          <ThemedText>
            {strings.rewards.parentLine(
              progress.streak,
              progress.bestStreak,
              progress.level,
              progress.gems,
              badges,
            )}
          </ThemedText>
        ) : null}
      </View>
      <TodaySessions sessions={sessions} onOpenSession={onOpenSession} />
      <RoutinePanel routine={routine} vacations={vacations} onEdit={onEditRoutine} />
      <RewardsPanel {...rewards} />
      {devices.length > 0 ? (
        <NudgePanel
          childName={child.display_name}
          reachable={devices.some((device) => device.push_status === 'enabled')}
          {...nudge}
        />
      ) : null}
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
              <PushStatusLine status={device.push_status} />
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

/** Whether reminders can reach this device, as it reported it. */
function PushStatusLine({ status }: { status: PairedDevice['push_status'] }) {
  const cannot = status === 'denied' || status === 'unsupported';
  return (
    <ThemedText variant="caption" tone={cannot ? 'danger' : 'muted'}>
      {t.push[status ?? 'unknown']}
    </ThemedText>
  );
}
