import { pairingLink } from '@math-genius/shared';
import { useState } from 'react';

import { useChildDevices } from '@/data/devices';
import { errorKind } from '@/data/errors';
import { useCreatePairingCode } from '@/data/pairing';
import type { PairingState } from '@/screens/child-detail';

import { useSecondsLeft } from './use-seconds-left';

/** Pairing code lifecycle for one child: show a code, then notice when a device redeems it. */
export function usePairingPanel(childId: string | undefined) {
  const createCode = useCreatePairingCode();
  const secondsLeft = useSecondsLeft(createCode.data?.expiresAt);
  // Paired devices when the current code was created: one more means the code was used.
  const [baseline, setBaseline] = useState<number | null>(null);

  const codeActive = createCode.isSuccess && secondsLeft > 0;
  const devices = useChildDevices(childId, codeActive ? baseline : null);
  const deviceCount = devices.data?.length ?? 0;

  let pairing: PairingState = { status: 'idle' };
  if (baseline !== null && deviceCount > baseline) {
    pairing = { status: 'paired' };
  } else if (createCode.data) {
    const { code } = createCode.data;
    pairing = { status: 'showing', code, link: pairingLink(code), secondsLeft };
  }

  return {
    pairing,
    devices: devices.data ?? [],
    creatingCode: createCode.isPending,
    pairingError: createCode.error ? errorKind(createCode.error) : null,
    createCode: () => {
      if (!childId) return;
      setBaseline(deviceCount);
      createCode.mutate(childId);
    },
  };
}
