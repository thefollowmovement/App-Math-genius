import type { Database } from '@math-genius/shared';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '';

/** Both values are set (apps/admin/.env.local). */
export const configured = url !== '' && key !== '';

/**
 * The publishable key only: every read and write runs as the signed-in team member, through Row
 * Level Security and the admin_* functions, which check the role again.
 */
export const supabase = createClient<Database>(
  url || 'http://127.0.0.1:54321',
  key || 'not-configured',
  { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'math-genius.admin.auth' } },
);
