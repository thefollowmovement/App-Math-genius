import type { Database } from '@math-genius/shared';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { env } from './env';
import { secureStorage } from './secure-storage';

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseKey, {
  auth: {
    storage: secureStorage,
    storageKey: 'math-genius.auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

// On native, refresh the session only while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
