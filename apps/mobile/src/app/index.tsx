import { useRouter } from 'expo-router';

import { Welcome } from '@/screens/welcome';

export default function WelcomeRoute() {
  const router = useRouter();

  return (
    <Welcome
      onChooseParent={() => router.push('/parent')}
      onChooseChild={() => router.push('/child')}
    />
  );
}
