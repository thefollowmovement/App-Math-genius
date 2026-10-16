import { Checkbox, Host } from '@expo/ui';
import { parentSignUpSchema, type ParentSignUp } from '@math-genius/shared';
import { Button, Screen, TextField, ThemedText } from '@math-genius/ui';
import { useState } from 'react';

import { ErrorMessage } from '@/components/error-message';
import type { ErrorKind } from '@/data/errors';
import { strings } from '@/i18n';
import { useFieldErrors } from '@/hooks/use-field-errors';

const t = strings.signUp;

type SignUpProps = {
  onSubmit: (values: ParentSignUp) => void;
  submitting: boolean;
  error: ErrorKind | null;
  onGoToSignIn: () => void;
};

export function SignUp({ onSubmit, submitting, error, onGoToSignIn }: SignUpProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const errors = useFieldErrors();

  function submit() {
    const result = parentSignUpSchema.safeParse({
      displayName,
      email: email.trim(),
      password,
      acceptsPrivacyPolicy: consent,
    });
    if (!result.success) return errors.report(result.error.issues);
    errors.reset();
    onSubmit(result.data);
  }

  return (
    <Screen>
      <ThemedText>{t.intro}</ThemedText>
      <TextField
        label={t.displayName}
        value={displayName}
        onChangeText={errors.onEdit('displayName', setDisplayName)}
        autoComplete="given-name"
        error={errors.has('displayName') ? t.errors.displayName : undefined}
      />
      <TextField
        label={t.email}
        value={email}
        onChangeText={errors.onEdit('email', setEmail)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.has('email') ? t.errors.email : undefined}
      />
      <TextField
        label={t.password}
        value={password}
        onChangeText={errors.onEdit('password', setPassword)}
        secureTextEntry
        autoComplete="new-password"
        error={errors.has('password') ? t.errors.password : undefined}
      />
      <Host matchContents={{ vertical: true }}>
        <Checkbox
          value={consent}
          onValueChange={errors.onEdit('acceptsPrivacyPolicy', setConsent)}
          label={t.consent}
        />
      </Host>
      {errors.has('acceptsPrivacyPolicy') ? (
        <ThemedText variant="caption" tone="danger">
          {t.errors.acceptsPrivacyPolicy}
        </ThemedText>
      ) : null}
      <ErrorMessage kind={error} />
      <Button size="lg" title={t.submit} loading={submitting} onPress={submit} />
      <Button variant="ghost" title={t.hasAccount} onPress={onGoToSignIn} />
    </Screen>
  );
}
