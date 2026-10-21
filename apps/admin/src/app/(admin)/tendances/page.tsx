'use client';

import { Suspense } from 'react';

import { TrendsView } from '@/components/trends/trends-view';

export default function TrendsPage() {
  // The radar opens the form prefilled from an « Autre » answer (?nouveau=…).
  return (
    <Suspense>
      <TrendsView />
    </Suspense>
  );
}
