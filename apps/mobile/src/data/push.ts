import { useEffect } from 'react';
import { Platform } from 'react-native';

import { pushToken } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

import { useUserId } from './session';

/** Token registered for the signed-in account, removed at sign-out. */
let registered: string | null = null;

/**
 * Registers this phone for the account's notifications: reminders for a child device, alerts for
 * a parent. Nothing happens on web or until notifications are allowed.
 */
export function usePushRegistration(enabled: boolean) {
  const userId = useUserId();
  useEffect(() => {
    if (!enabled || !userId || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;
    const platform = Platform.OS;
    let cancelled = false;
    void (async () => {
      const token = await pushToken();
      if (!token || cancelled) return;
      const { error } = await supabase.rpc('register_push_token', {
        p_token: token,
        p_platform: platform,
      });
      if (!error) registered = token;
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, userId]);
}

/** Before signing out: this phone stops receiving the account's notifications. */
export async function unregisterPushToken() {
  if (!registered) return;
  await supabase.rpc('unregister_push_token', { p_token: registered });
  registered = null;
}
