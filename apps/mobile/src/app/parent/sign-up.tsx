import { useRouter } from 'expo-router';

import { useParentSignUp } from '@/data/auth';
import { errorKind } from '@/data/errors';
import { SignUp } from '@/screens/sign-up';

export default function SignUpRoute() {
  const router = useRouter();
  const signUp = useParentSignUp();

  return (
    <SignUp
      onSubmit={(values) => signUp.mutate(values)}
      submitting={signUp.isPending}
      error={signUp.error ? errorKind(signUp.error) : null}
      onGoToSignIn={() => router.replace('/parent/sign-in')}
    />
  );
}
