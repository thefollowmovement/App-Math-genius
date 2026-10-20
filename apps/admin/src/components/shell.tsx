'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { strings } from '@/i18n/fr';
import { supabase } from '@/lib/supabase';
import { pageOf, pagesFor, type AdminRole } from '@/models/navigation';

import { Button, join } from './ui';

/** The menu of the pages the role may open, the account, and the page. */
export function Shell({
  email,
  role,
  children,
}: {
  email: string;
  role: AdminRole;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const current = pageOf(pathname);
  const client = useQueryClient();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col gap-4 border-b border-border bg-surface p-4 md:w-64 md:border-r md:border-b-0">
        <p className="font-bold">{strings.appName}</p>
        <nav aria-label={strings.shell.menu}>
          <ul className="flex gap-1 overflow-x-auto md:flex-col">
            {pagesFor(role).map((page) => (
              <li key={page}>
                <Link
                  href={`/${page}`}
                  aria-current={current === page ? 'page' : undefined}
                  className={join(
                    'block rounded-md px-3 py-2 text-sm whitespace-nowrap',
                    current === page
                      ? 'bg-primary-soft font-semibold text-primary'
                      : 'text-foreground hover:bg-raised',
                  )}
                >
                  {strings.pages[page]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col gap-2 text-sm">
          <p className="truncate text-muted" title={email}>
            {email}
          </p>
          <p className="font-medium">{strings.roles[role]}</p>
          <Button
            small
            onClick={async () => {
              await supabase.auth.signOut();
              client.clear();
            }}
          >
            {strings.shell.signOut}
          </Button>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-8">{children}</main>
    </div>
  );
}
