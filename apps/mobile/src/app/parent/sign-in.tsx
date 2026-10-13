import { useRouter } from 'expo-router';

import { useParentSignIn } from '@/data/auth';
import { errorKind } from '@/data/errors';
import { SignIn } from '@/screens/sign-in';

export default function SignInRoute() {
  const router = useRouter();
  const signIn = useParentSignIn();

  return (
    <SignIn
      onSubmit={(values) => signIn.mutate(values)}
      submitting={signIn.isPending}
      error={signIn.error ? errorKind(signIn.error) : null}
      onGoToSignUp={() => router.replace('/parent/sign-up')}
    />
  );
}
