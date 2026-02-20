import { supabase, supabaseSpend } from './supabase'

const db = supabaseSpend ?? supabase

/** Row shape from Supabase `vendors` table (Vendor Master). */
export type VendorRow = {
  id: string
  name: string
  trade: string
  status: string
  rating: number | null
  compliance: string | null
  city: string | null
  mbe: boolean | null
  wbe: boolean | null
  ytd_spend: string | null
  created_at?: string
  updated_at?: string
}

/** UI shape for Vendor Master grid. */
export type MasterVendor = {
  id: string
  n: string
  trade: string
  status: 'Connected' | 'Available'
  rating: number
  comp: 'green' | 'yellow' | 'red'
  city: string
  mbe?: boolean
  wbe?: boolean
  spend?: string
}

function mapRowToMaster(row: VendorRow): MasterVendor {
  const status = (row.status === 'Connected' || row.status === 'Available' ? row.status : 'Available') as 'Connected' | 'Available'
  const comp = (row.compliance === 'green' || row.compliance === 'yellow' || row.compliance === 'red' ? row.compliance : 'green') as 'green' | 'yellow' | 'red'
  return {
    id: row.id,
    n: row.name,
    trade: row.trade,
    status,
    rating: row.rating ?? 0,
    comp,
    city: row.city ?? '',
    mbe: row.mbe ?? false,
    wbe: row.wbe ?? false,
    spend: row.ytd_spend ?? undefined,
  }
}

/**
 * Fetches Vendor Master list from Supabase `vendors` table.
 * Returns empty array on error (e.g. table missing); use fallback data in the UI if needed.
 */
export async function fetchVendors(): Promise<MasterVendor[]> {
  const { data, error } = await db.from('vendors').select('*').order('name')
  if (error) return []
  return (data ?? []).map((row) => mapRowToMaster(row as VendorRow))
}
