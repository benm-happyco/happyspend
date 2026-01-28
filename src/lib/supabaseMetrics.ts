import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_METRICS_URL
const supabaseAnonKey = import.meta.env.VITE_METRICS_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing metrics Supabase environment variables. Please check your .env.local file.')
}

export const supabaseMetrics = createClient(supabaseUrl, supabaseAnonKey)
