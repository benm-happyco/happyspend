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
  if (!data || typeof data !== 'object') return null
  const row = data as Record<string, unknown>
  return {
    id: String(row.id ?? ''),
    external_id: row.external_id != null ? String(row.external_id) : null,
    name: String(row.name ?? ''),
    phase: String(row.phase ?? ''),
    status: String(row.status ?? ''),
    project: row.project != null ? String(row.project) : null,
    property: row.property != null ? String(row.property) : null,
    bids: Number(row.bids) || 0,
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_date: row.created_date != null ? String(row.created_date) : null,
    deadline: row.deadline != null ? String(row.deadline) : null,
    type: String(row.type ?? ''),
    budget: row.budget != null ? Number(row.budget) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  } as SourcingEvent
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

export type CreateSourcingEventInput = {
  name: string
  phase?: string
  status?: string
  project?: string | null
  property?: string | null
  type?: 'RFQ' | 'RFP' | 'RFI'
  budget?: number | null
  deadline?: string | null
}

export async function createSourcingEvent(input: CreateSourcingEventInput): Promise<SourcingEvent> {
  const { data, error } = await db
    .from('sourcing_events')
    .insert({
      name: input.name,
      phase: input.phase ?? 'Planning & Creation',
      status: input.status ?? 'Draft',
      project: input.project ?? null,
      property: input.property ?? null,
      bids: 0,
      type: input.type ?? 'RFQ',
      budget: input.budget ?? null,
      deadline: input.deadline ?? null,
    })
    .select()
    .single()
  if (error) throw error
  const row = data as Record<string, unknown>
  return {
    id: String(row.id ?? ''),
    external_id: row.external_id != null ? String(row.external_id) : null,
    name: String(row.name ?? ''),
    phase: String(row.phase ?? ''),
    status: String(row.status ?? ''),
    project: row.project != null ? String(row.project) : null,
    property: row.property != null ? String(row.property) : null,
    bids: Number(row.bids) || 0,
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_date: row.created_date != null ? String(row.created_date) : null,
    deadline: row.deadline != null ? String(row.deadline) : null,
    type: String(row.type ?? ''),
    budget: row.budget != null ? Number(row.budget) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  } as SourcingEvent
}

export async function updateSourcingEventStatus(
  eventId: string,
  newStatus: string
): Promise<SourcingEvent | null> {
  const { data, error } = await db
    .from('sourcing_events')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .or(`id.eq.${eventId},external_id.eq.${eventId}`)
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data || typeof data !== 'object') return null
  const row = data as Record<string, unknown>
  return {
    id: String(row.id ?? ''),
    external_id: row.external_id != null ? String(row.external_id) : null,
    name: String(row.name ?? ''),
    phase: String(row.phase ?? ''),
    status: String(row.status ?? ''),
    project: row.project != null ? String(row.project) : null,
    property: row.property != null ? String(row.property) : null,
    bids: Number(row.bids) || 0,
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_date: row.created_date != null ? String(row.created_date) : null,
    deadline: row.deadline != null ? String(row.deadline) : null,
    type: String(row.type ?? ''),
    budget: row.budget != null ? Number(row.budget) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  } as SourcingEvent
}
