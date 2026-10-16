import { useRouter } from 'expo-router';

import { useCreateChild } from '@/data/children';
import { errorKind } from '@/data/errors';
import { ChildForm } from '@/screens/child-form';

export default function NewChildRoute() {
  const router = useRouter();
  const createChild = useCreateChild();

  return (
    <ChildForm
      currentYear={new Date().getFullYear()}
      onSubmit={(profile) =>
        createChild.mutate(profile, {
          // Straight to pairing: the next step of the parent's onboarding.
          onSuccess: (child) =>
            router.replace({ pathname: '/parent/children/[id]', params: { id: child.id } }),
        })
      }
      submitting={createChild.isPending}
      error={createChild.error ? errorKind(createChild.error) : null}
    />
  );
}
