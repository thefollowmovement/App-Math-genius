import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { urlOnMetroHost } from './dev-host';

// EXPO_PUBLIC_ variables are inlined at build time, so they must be read with static property access.
const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!configuredUrl || !supabaseKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY are missing: copy apps/mobile/.env.example to apps/mobile/.env.local.',
  );
}

// In development on a phone or an emulator, local Supabase is reached on the computer running
// Metro (its network address), not on 127.0.0.1. The browser runs on that computer already.
const supabaseUrl =
  __DEV__ && Platform.OS !== 'web'
    ? urlOnMetroHost(configuredUrl, Constants.expoConfig?.hostUri)
    : configuredUrl;

export const env = { supabaseUrl, supabaseKey };
