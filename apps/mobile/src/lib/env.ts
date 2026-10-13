// EXPO_PUBLIC_ variables are inlined at build time, so they must be read with static property access.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY are missing: copy apps/mobile/.env.example to apps/mobile/.env.local.',
  );
}

export const env = { supabaseUrl, supabaseKey };
