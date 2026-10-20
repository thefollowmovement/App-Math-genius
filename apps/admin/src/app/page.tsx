'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Loading } from '@/components/ui';
import { strings } from '@/i18n/fr';
import { useAuth } from '@/lib/auth';
import { homeFor } from '@/models/navigation';

export default function Home() {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (auth.status === 'signed-out') router.replace('/connexion');
    if (auth.status === 'signed-in') {
      const home = homeFor(auth.role);
      router.replace(home ? `/${home}` : '/connexion');
    }
  }, [auth, router]);
  return (
    <main className="p-8">
      <Loading label={strings.loading} />
    </main>
  );
}
