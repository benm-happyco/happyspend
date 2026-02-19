import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** Optional second Supabase project for Happy Spend (sourcing_events). If set in .env.local, Happy Spend uses this. */
const spendUrl = import.meta.env.VITE_SUPABASE_SPEND_URL
const spendAnonKey = import.meta.env.VITE_SUPABASE_SPEND_ANON_KEY
export const supabaseSpend: SupabaseClient | null =
  spendUrl && spendAnonKey ? createClient(spendUrl, spendAnonKey) : null


