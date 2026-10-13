import { parentSignInSchema, type ParentSignIn } from '@math-genius/shared';
import { Button, Screen, TextField } from '@math-genius/ui';
import { useState } from 'react';

import { ErrorMessage } from '@/components/error-message';
import type { ErrorKind } from '@/data/errors';
import { strings } from '@/i18n';
import { useFieldErrors } from '@/hooks/use-field-errors';

const t = strings.signIn;

type SignInProps = {
  onSubmit: (values: ParentSignIn) => void;
  submitting: boolean;
  error: ErrorKind | null;
  onGoToSignUp: () => void;
};

export function SignIn({ onSubmit, submitting, error, onGoToSignUp }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const errors = useFieldErrors();

  function submit() {
    const result = parentSignInSchema.safeParse({ email: email.trim(), password });
    if (!result.success) return errors.report(result.error.issues);
    errors.reset();
    onSubmit(result.data);
  }

  return (
    <Screen>
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
        autoComplete="current-password"
        onSubmitEditing={submit}
        error={errors.has('password') ? t.errors.password : undefined}
      />
      <ErrorMessage kind={error} />
      <Button size="lg" title={t.submit} loading={submitting} onPress={submit} />
      <Button variant="ghost" title={t.noAccount} onPress={onGoToSignUp} />
    </Screen>
  );
}
