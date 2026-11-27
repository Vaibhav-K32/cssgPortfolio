import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing SUPABASE_URL, SUPABASE_SECRET_KEY or SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and fill them in.'
  );
}

// ADMIN client. The secret key BYPASSES Row Level Security.
// Only used for public reads (the opportunity list). Never in the frontend.
export const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

// A client that acts AS the logged-in user, so auth.uid() is their id and RLS applies.
export function supabaseAs(token) {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}