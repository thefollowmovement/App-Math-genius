import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { strings } from '@/i18n/fr';

import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: strings.appName,
  // An internal tool: never indexed.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
