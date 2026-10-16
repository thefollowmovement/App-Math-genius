import { useEffect } from 'react';
import { Platform } from 'react-native';

import { pushSetup } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

import { useUserId, type AccountKind } from './session';

/** Token registered for the signed-in account, removed at sign-out. */
let registered: string | null = null;

/**
 * Registers this phone for the account's notifications: reminders for a child device, alerts for
 * a parent. A child device also tells the server whether it can show them, for its parent.
 */
export function usePushRegistration(account: AccountKind | null) {
  const userId = useUserId();
  useEffect(() => {
    if (!account || !userId) return;
    let cancelled = false;
    void (async () => {
      const setup = await pushSetup();
      if (!setup || cancelled) return;
      if (setup.status === 'enabled' && (Platform.OS === 'ios' || Platform.OS === 'android')) {
        const { error } = await supabase.rpc('register_push_token', {
          p_token: setup.token,
          p_platform: Platform.OS,
        });
        if (!error) registered = setup.token;
      }
      if (account === 'device' && !cancelled) {
        await supabase.rpc('report_push_status', { p_status: setup.status });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [account, userId]);
}

/** Before signing out: this phone stops receiving the account's notifications. */
export async function unregisterPushToken() {
  if (!registered) return;
  await supabase.rpc('unregister_push_token', { p_token: registered });
  registered = null;
}
