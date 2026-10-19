import { QueryClient, QueryObserver } from '@tanstack/react-query';

import { refetchAfterWrite } from './query-client';

describe('refetchAfterWrite', () => {
  it('drops a fetch that read the database before the write', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let rows: string[] = [];
    // Reads the rows when the request reaches the database, answers a little later.
    const queryFn = async () => {
      const snapshot = [...rows];
      await new Promise((resolve) => setTimeout(resolve, 20));
      return snapshot;
    };
    const observer = new QueryObserver(client, { queryKey: ['children', 'device'], queryFn });
    const unsubscribe = observer.subscribe(() => {});

    // A device is paired while its first profiles query is still on its way.
    rows = ['Léa'];
    await refetchAfterWrite(client, ['children']);

    expect(client.getQueryData(['children', 'device'])).toEqual(['Léa']);
    unsubscribe();
    client.clear();
  });
});
