import type { ProgressRange } from '@math-genius/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { LoadingScreen } from '@/components/loading-screen';
import { useChild } from '@/data/children';
import { useChildProgress, useMonthlyRecaps, useOpenRecapPdf } from '@/data/progress';
import { shiftMonth } from '@/data/progress-model';
import { Progress } from '@/screens/progress';

export default function ProgressRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const [range, setRange] = useState<ProgressRange>('month');
  // Null: the current month.
  const [month, setMonth] = useState<string | null>(null);
  const progress = useChildProgress(id, range, month);
  const recaps = useMonthlyRecaps(id);
  const openPdf = useOpenRecapPdf();

  if (!child.data) return <LoadingScreen />;

  const today = progress.data?.today ?? null;
  const currentMonth = today ? `${today.slice(0, 7)}-01` : null;
  const shown = progress.data?.calendar.month ?? month ?? currentMonth ?? '';

  return (
    <Progress
      childName={child.data.display_name}
      grade={child.data.grade}
      progress={progress.data}
      error={progress.isError}
      onRetry={() => void progress.refetch()}
      range={range}
      onRange={setRange}
      month={shown}
      onMonth={(direction) => setMonth(shiftMonth(shown, direction === 'next' ? 1 : -1))}
      canGoNext={currentMonth !== null && shown < currentMonth}
      recaps={recaps.data ?? []}
      onOpenRecap={(recapId) => openPdf.mutate(recapId)}
      openingRecapId={openPdf.isPending ? (openPdf.variables ?? null) : null}
      recapError={openPdf.isError}
      onOpenSettings={() => router.push('/parent/recaps')}
    />
  );
}
