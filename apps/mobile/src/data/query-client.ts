import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, type QueryKey } from '@tanstack/react-query';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    // Kept a week so that a child can start the app offline with their profile.
    queries: { staleTime: 30_000, gcTime: WEEK_MS, retry: 1 },
    mutations: { retry: 0 },
  },
});

/**
 * Refetches queries after a write that changes their answer. A plain invalidation reuses a fetch
 * still in flight when the query has no data yet, and that fetch may have read the database before
 * the write: it is cancelled and started again.
 */
export async function refetchAfterWrite(client: QueryClient, queryKey: QueryKey) {
  await client.cancelQueries({ queryKey });
  await client.invalidateQueries({ queryKey });
}

/**
 * Profiles, routines, rewards and the universes are kept on the device; practice data has its own
 * store.
 */
const PERSISTED_QUERIES = new Set([
  'children',
  'routines',
  'rewards',
  'universes',
  'interests',
  'learner-profile',
]);

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: createAsyncStoragePersister({
    storage: AsyncStorage,
    key: 'math-genius.queries',
  }),
  maxAge: WEEK_MS,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      query.state.status === 'success' && PERSISTED_QUERIES.has(String(query.queryKey[0])),
  },
};
