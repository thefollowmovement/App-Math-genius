'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { Shell } from '@/components/shell';
import { Loading } from '@/components/ui';
import { strings } from '@/i18n/fr';
import { useAuth } from '@/lib/auth';
import { canSee, homeFor, pageOf } from '@/models/navigation';

/** The team's pages: signed in with a role, and only the pages of that role. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const page = pageOf(usePathname());
  const role = auth.status === 'signed-in' ? auth.role : null;
  const allowed = role !== null && page !== null && canSee(role, page);

  useEffect(() => {
    if (auth.status === 'signed-out' || (auth.status === 'signed-in' && !auth.role)) {
      router.replace('/connexion');
    } else if (auth.status === 'signed-in' && !allowed) {
      const home = homeFor(auth.role);
      router.replace(home ? `/${home}` : '/connexion');
    }
  }, [auth, allowed, router]);

  if (auth.status !== 'signed-in' || role === null || !allowed) {
    return (
      <main className="p-8">
        <Loading label={strings.loading} />
      </main>
    );
  }
  return (
    <Shell email={auth.email} role={role}>
      {children}
    </Shell>
  );
}
