import { Button, ThemedText, useTheme, View } from '@math-genius/ui';
import QRCode from 'react-native-qrcode-svg';

import type { ErrorKind } from '@/data/errors';
import { ErrorMessage } from '@/components/error-message';
import { strings } from '@/i18n';

const t = strings.childDetail;

/** 56 steps of the 4 px grid: large enough to scan from arm's length. */
const QR_CODE_SIZE = 224;

export type PairingState =
  | { status: 'idle' }
  | { status: 'showing'; code: string; link: string; secondsLeft: number }
  | { status: 'paired' };

type PairingPanelProps = {
  pairing: PairingState;
  creating: boolean;
  error: ErrorKind | null;
  onCreateCode: () => void;
};

export function PairingPanel({ pairing, creating, error, onCreateCode }: PairingPanelProps) {
  const { colors } = useTheme();
  const expired = pairing.status === 'showing' && pairing.secondsLeft === 0;

  return (
    <View className="gap-4 rounded-lg border border-border bg-surface p-6">
      <ThemedText variant="headline">{t.pairTitle}</ThemedText>

      {pairing.status === 'paired' ? <ThemedText>{t.paired}</ThemedText> : null}

      {pairing.status === 'showing' ? (
        <>
          <ThemedText variant="caption">{t.pairSteps}</ThemedText>
          <View className="items-center gap-3">
            {expired ? null : (
              <QRCode
                value={pairing.link}
                size={QR_CODE_SIZE}
                color={colors.foreground}
                backgroundColor={colors.surface}
              />
            )}
            <ThemedText variant="caption">{t.codeLabel}</ThemedText>
            <ThemedText variant="display" selectable testID="pairing-code">
              {pairing.code}
            </ThemedText>
            <ThemedText variant="caption" tone={expired ? 'danger' : 'muted'}>
              {expired ? t.expired : t.expiresIn(Math.ceil(pairing.secondsLeft / 60))}
            </ThemedText>
          </View>
        </>
      ) : null}

      <ErrorMessage kind={error} />
      <Button
        variant={pairing.status === 'showing' ? 'secondary' : 'primary'}
        title={pairing.status === 'idle' ? t.createCode : t.newCode}
        loading={creating}
        onPress={onCreateCode}
      />
    </View>
  );
}
