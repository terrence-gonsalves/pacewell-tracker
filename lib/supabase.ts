import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Check .env.local');
}

if (!supabaseServiceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not set. Some operations may fail.');
}

// regular client (respects RLS policies)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// service role client (bypasses RLS policies)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);