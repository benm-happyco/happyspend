import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_METRICS_URL
const supabaseAnonKey = import.meta.env.VITE_METRICS_ANON_KEY

export const metricsSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// NOTE:
// We intentionally avoid throwing at module load, so the app can still render in environments
// where metrics env vars are missing (e.g. misconfigured Vercel). Pages can show a friendly
// message and remain interactive instead of hard-crashing.
const FALLBACK_URL = 'https://invalid.supabase.co'
const FALLBACK_KEY = 'invalid'

export const supabaseMetrics = createClient(supabaseUrl ?? FALLBACK_URL, supabaseAnonKey ?? FALLBACK_KEY)
