import { pairingCodeSchema } from '@math-genius/shared';
import { Button, Screen, TextField, ThemedText } from '@math-genius/ui';
import { useState, type ReactNode } from 'react';

import { ErrorMessage } from '@/components/error-message';
import type { ErrorKind } from '@/data/errors';
import { strings } from '@/i18n';

const t = strings.pairDevice;

type PairDeviceProps = {
  onSubmitCode: (code: string) => void;
  submitting: boolean;
  error: ErrorKind | null;
  /** QR scanner, on devices that have a camera. */
  scanner?: ReactNode;
  initialCode?: string;
};

export function PairDevice({
  onSubmitCode,
  submitting,
  error,
  scanner,
  initialCode = '',
}: PairDeviceProps) {
  const [code, setCode] = useState(initialCode);
  const [invalid, setInvalid] = useState(false);

  function submit() {
    const result = pairingCodeSchema.safeParse(code);
    setInvalid(!result.success);
    if (result.success) onSubmitCode(result.data);
  }

  return (
    <Screen>
      <ThemedText variant="title" className="text-center">
        {t.title}
      </ThemedText>
      <ThemedText className="text-center">{t.intro}</ThemedText>
      {scanner ? (
        <>
          <ThemedText variant="headline" className="text-center">
            {t.scan}
          </ThemedText>
          {scanner}
          <ThemedText variant="caption" className="text-center">
            {t.orType}
          </ThemedText>
        </>
      ) : null}
      <TextField
        label={t.code}
        value={code}
        onChangeText={(value) => {
          setCode(value);
          setInvalid(false);
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        maxLength={7}
        onSubmitEditing={submit}
        error={invalid ? t.errors.code : undefined}
      />
      <ErrorMessage kind={error} />
      <Button size="lg" title={t.submit} loading={submitting} onPress={submit} />
    </Screen>
  );
}
