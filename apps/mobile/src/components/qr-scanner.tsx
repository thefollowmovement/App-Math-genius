import { Button, ThemedText, View } from '@math-genius/ui';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StyleSheet } from 'react-native';

import { strings } from '@/i18n';

type QrScannerProps = {
  /** Called with the raw content of each QR code seen; omit it to pause scanning. */
  onScan?: (payload: string) => void;
};

export function QrScanner({ onScan }: QrScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return null;

  if (!permission.granted) {
    return permission.canAskAgain ? (
      <Button
        variant="secondary"
        title={strings.pairDevice.allowCamera}
        onPress={requestPermission}
      />
    ) : (
      <ThemedText variant="caption" className="text-center">
        {strings.pairDevice.cameraDenied}
      </ThemedText>
    );
  }

  return (
    <View className="aspect-square w-full overflow-hidden rounded-lg bg-surface">
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onScan ? ({ data }) => onScan(data) : undefined}
      />
    </View>
  );
}
