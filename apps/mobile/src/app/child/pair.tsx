import { parsePairingPayload } from '@math-genius/shared';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useRef } from 'react';
import { Platform } from 'react-native';

import { QrScanner } from '@/components/qr-scanner';
import { errorKind } from '@/data/errors';
import { useRedeemPairingCode } from '@/data/pairing';
import { useAccountKind } from '@/data/session';
import { PairDevice } from '@/screens/pair-device';

export default function PairRoute() {
  const router = useRouter();
  // Set when the app opens from the pairing link encoded in the QR code.
  const { code: linkedCode } = useLocalSearchParams<{ code?: string }>();
  const kind = useAccountKind();
  const redeem = useRedeemPairingCode();
  const lastScanned = useRef<string | null>(null);

  // Pairing is for child devices; a parent account already reaches every profile.
  if (kind === 'parent') return <Redirect href="/child/profiles" />;

  function submit(code: string) {
    redeem.mutate(code, { onSuccess: () => router.replace('/child') });
  }

  function scan(payload: string) {
    const code = parsePairingPayload(payload);
    // The camera reports the same QR code many times per second: try each code once.
    if (!code || code === lastScanned.current) return;
    lastScanned.current = code;
    submit(code);
  }

  return (
    <PairDevice
      initialCode={linkedCode ? (parsePairingPayload(linkedCode) ?? '') : ''}
      onSubmitCode={submit}
      submitting={redeem.isPending}
      error={redeem.error ? errorKind(redeem.error) : null}
      scanner={
        Platform.OS === 'web' ? undefined : (
          <QrScanner onScan={redeem.isPending || redeem.isSuccess ? undefined : scan} />
        )
      }
    />
  );
}
