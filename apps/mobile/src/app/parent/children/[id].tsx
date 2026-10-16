import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { useRevokeDevice } from '@/data/devices';
import { useTodaySessions } from '@/data/family-sessions';
import { usePairingPanel } from '@/hooks/use-pairing-panel';
import { ChildDetail } from '@/screens/child-detail';

export default function ChildDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const panel = usePairingPanel(id);
  const revokeDevice = useRevokeDevice();
  const sessions = useTodaySessions();

  if (!child.data) return <LoadingScreen />;

  return (
    <>
      <Stack.Title>{child.data.display_name}</Stack.Title>
      <ChildDetail
        child={child.data}
        sessions={(sessions.data ?? []).filter((session) => session.child_id === id)}
        onOpenSession={(sessionId) =>
          router.push({ pathname: '/parent/sessions/[id]', params: { id: sessionId } })
        }
        pairing={panel.pairing}
        creatingCode={panel.creatingCode}
        pairingError={panel.pairingError}
        onCreateCode={panel.createCode}
        devices={panel.devices}
        revokingDeviceId={revokeDevice.isPending ? revokeDevice.variables : null}
        onRevokeDevice={(deviceId) => revokeDevice.mutate(deviceId)}
      />
    </>
  );
}
