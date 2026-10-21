import {
  type ChildHighlights,
  type ChildProgress,
  type ProgressRange,
  readHighlights,
  readProgress,
} from '@math-genius/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';

import { useUserId } from './session';

/**
 * The parent's « Progrès » page, the monthly recaps and their PDF, the recap settings, and the
 * child's card (supabase/migrations/*_statistics.sql and *_recaps.sql). Everything is computed by
 * the database; the page and the card only read it.
 */

/** Under the `sessions` key: the live sessions of the parent's pages refresh it. */
export function useChildProgress(
  childId: string | undefined,
  range: ProgressRange,
  month: string | null,
) {
  return useQuery({
    queryKey: ['sessions', 'progress', childId, range, month],
    enabled: childId !== undefined,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ChildProgress> => {
      const { data, error } = await supabase.rpc('child_progress', {
        p_child_id: childId ?? '',
        p_range: range,
        ...(month ? { p_month: month } : {}),
      });
      if (error) throw error;
      const progress = readProgress(data);
      if (!progress) throw new Error('progress_unreadable');
      return progress;
    },
  });
}

export type MonthlyRecapRow = { id: string; periodStart: string };

/** The child's monthly recaps, the latest first. */
export function useMonthlyRecaps(childId: string | undefined) {
  return useQuery({
    queryKey: ['recaps', childId],
    enabled: childId !== undefined,
    queryFn: async (): Promise<MonthlyRecapRow[]> => {
      const { data, error } = await supabase
        .from('recaps')
        .select('id, period_start')
        .eq('child_id', childId ?? '')
        .eq('kind', 'monthly')
        .order('period_start', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data.map((row) => ({ id: row.id, periodStart: row.period_start }));
    },
  });
}

/** Opens a monthly recap's PDF: a signed link from the recaps Edge Function, valid 10 minutes. */
export function useOpenRecapPdf() {
  return useMutation({
    mutationFn: async (recapId: string) => {
      const { data, error } = await supabase.functions.invoke('recaps', {
        body: { task: 'pdf', recap_id: recapId },
      });
      if (error) throw error;
      const url = (data as { url?: unknown } | null)?.url;
      if (typeof url !== 'string') throw new Error('pdf_unavailable');
      await Linking.openURL(url);
    },
  });
}

export type RecapPreferences = {
  weeklyPush: boolean;
  weeklyEmail: boolean;
  monthlyPush: boolean;
  monthlyEmail: boolean;
};

const COLUMNS = {
  weeklyPush: 'weekly_push',
  weeklyEmail: 'weekly_email',
  monthlyPush: 'monthly_push',
  monthlyEmail: 'monthly_email',
} as const;

/** The signed-in parent's own choices (one row, created with the parent). */
export function useRecapPreferences() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['recap-preferences', userId],
    enabled: userId !== undefined,
    queryFn: async (): Promise<RecapPreferences | null> => {
      const { data, error } = await supabase
        .from('recap_preferences')
        .select('weekly_push, weekly_email, monthly_push, monthly_email')
        .maybeSingle();
      if (error) throw error;
      return data
        ? {
            weeklyPush: data.weekly_push,
            weeklyEmail: data.weekly_email,
            monthlyPush: data.monthly_push,
            monthlyEmail: data.monthly_email,
          }
        : null;
    },
  });
}

/** Changes one switch, shown at once and kept on the server. */
export function useSetRecapPreference() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const queryKey = ['recap-preferences', userId];
  return useMutation({
    mutationFn: async ({ key, value }: { key: keyof RecapPreferences; value: boolean }) => {
      const row: Partial<Record<(typeof COLUMNS)[keyof RecapPreferences], boolean>> = {};
      row[COLUMNS[key]] = value;
      const { error } = await supabase.from('recap_preferences').update(row).not('id', 'is', null);
      if (error) throw error;
    },
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey });
      const before = queryClient.getQueryData<RecapPreferences | null>(queryKey);
      if (before) queryClient.setQueryData(queryKey, { ...before, [key]: value });
      return { before };
    },
    onError: (_error, _change, context) => {
      if (context?.before) queryClient.setQueryData(queryKey, context.before);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

/** The child's card at the start of a week or a month; null when there is nothing to show. */
export function useChildHighlights(childId: string | undefined) {
  return useQuery({
    queryKey: ['highlights', childId],
    enabled: childId !== undefined,
    staleTime: 60 * 60_000,
    queryFn: async (): Promise<ChildHighlights | null> => {
      const { data, error } = await supabase.rpc('child_highlights', { p_child_id: childId ?? '' });
      if (error) throw error;
      return readHighlights(data);
    },
  });
}
