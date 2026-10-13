import { Stack, useLocalSearchParams } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { useRevokeDevice } from '@/data/devices';
import { usePairingPanel } from '@/hooks/use-pairing-panel';
import { ChildDetail } from '@/screens/child-detail';

export default function ChildDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const panel = usePairingPanel(id);
  const revokeDevice = useRevokeDevice();

  if (!child.data) return <LoadingScreen />;

  return (
    <>
      <Stack.Title>{child.data.display_name}</Stack.Title>
      <ChildDetail
        child={child.data}
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
