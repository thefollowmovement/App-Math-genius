import { ThemedText } from '@math-genius/ui';
import { renderRouter, screen } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import { loadNotifications, pushSetup } from '@/lib/notifications';

// What Expo Go on Android does since SDK 53: loading expo-notifications throws because one of
// its native modules is gone. The app used to crash on every route.
const mockLoadAttempts = jest.fn();
jest.mock('expo-notifications', () => {
  mockLoadAttempts();
  throw new Error("Cannot find native module 'ExpoTopicSubscriptionModule'");
});
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
  },
}));

function Home() {
  return <ThemedText>Accueil</ThemedText>;
}

describe('app start without the notifications native module', () => {
  it('renders the routes, without push', async () => {
    await renderRouter({ _layout: RootLayout, index: Home });

    expect(await screen.findByText('Accueil')).toBeOnTheScreen();
    expect(mockLoadAttempts).toHaveBeenCalledTimes(1);
    expect(loadNotifications()).toBeNull();
    await expect(pushSetup()).resolves.toEqual({ status: 'unsupported' });
  });
});
