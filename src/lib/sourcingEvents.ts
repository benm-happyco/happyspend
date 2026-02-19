import { supabase, supabaseSpend } from './supabase'

/** Use the Spend Supabase project when configured, otherwise the default project. */
const db = supabaseSpend ?? supabase

export type SourcingEvent = {
  id: string
  external_id: string | null
  name: string
  phase: string
  status: string
  project: string | null
  property: string | null
  bids: number
  created_by: string | null
  created_date: string | null
  deadline: string | null
  type: string
  budget: number | null
  created_at: string
  updated_at: string
}

export type SourcingEventsFilters = {
  search?: string
  status?: string[]
  phase?: string | null
}

export async function fetchSourcingEvents(
  filters?: SourcingEventsFilters
): Promise<SourcingEvent[]> {
  let q = db.from('sourcing_events').select('*').order('created_date', { ascending: false })

  if (filters?.search?.trim()) {
    q = q.ilike('name', `%${filters.search.trim()}%`)
  }
  if (filters?.status?.length) {
    q = q.in('status', filters.status)
  }
  if (filters?.phase) {
    q = q.eq('phase', filters.phase)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as SourcingEvent[]
}

export async function fetchSourcingEventById(id: string): Promise<SourcingEvent | null> {
  const { data, error } = await db
    .from('sourcing_events')
    .select('*')
    .or(`id.eq.${id},external_id.eq.${id}`)
    .maybeSingle()
  if (error) throw error
  return data as SourcingEvent | null
}

export type DashboardStats = {
  activeRfx: number
  pendingApprovals: number
  underReview: number
  totalBudget: number
  totalResponses: number
  byPhase: Record<string, number>
  recentEvents: SourcingEvent[]
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data: events, error } = await db
    .from('sourcing_events')
    .select('*')
    .order('created_date', { ascending: false })
  if (error) throw error
  const list = (events ?? []) as SourcingEvent[]

  const activeStatuses = ['Open', 'Amendment Draft', 'Amended']
  const pendingStatuses = ['Pending Approval', 'Award Pending']
  const activeRfx = list.filter((e) => activeStatuses.includes(e.status)).length
  const pendingApprovals = list.filter((e) => pendingStatuses.includes(e.status)).length
  const underReview = list.filter((e) => e.status === 'Under Review').length
  const totalBudget = list.reduce((sum, e) => sum + (e.budget ?? 0), 0)
  const totalResponses = list.reduce((sum, e) => sum + (e.bids ?? 0), 0)

  const byPhase: Record<string, number> = {}
  for (const e of list) {
    byPhase[e.phase] = (byPhase[e.phase] ?? 0) + 1
  }

  return {
    activeRfx,
    pendingApprovals,
    underReview,
    totalBudget,
    totalResponses,
    byPhase,
    recentEvents: list.slice(0, 10),
  }
}
