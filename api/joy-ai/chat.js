/**
 * Minimal JOYAI → OpenAI bridge (Vercel Serverless Function).
 *
 * Set env var:
 * - OPENAI_API_KEY
 * Optional:
 * - OPENAI_MODEL (default: gpt-4o-mini)
 */
import { createClient } from '@supabase/supabase-js'

function dateKey(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function getPreviousPeriod(startDate, endDate) {
  const end = new Date(endDate)
  const start = new Date(startDate)
  const days = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  const prevEnd = addDays(start, -1)
  const prevStart = addDays(prevEnd, -days + 1)
  return { startDate: dateKey(prevStart), endDate: dateKey(prevEnd) }
}

function asNumber(v) {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}

async function buildMetricsContext({ selectedPropertyIds, dateRange }) {
  const url = process.env.VITE_METRICS_URL
  const anon = process.env.VITE_METRICS_ANON_KEY
  if (!url || !anon) return { ok: false, reason: 'Metrics Supabase env vars not configured on server' }

  const ids = Array.isArray(selectedPropertyIds) ? selectedPropertyIds.filter((x) => typeof x === 'string').slice(0, 25) : []
  const startDate = dateRange?.startDate
  const endDate = dateRange?.endDate
  if (!ids.length || typeof startDate !== 'string' || typeof endDate !== 'string') {
    return { ok: true, note: 'No properties selected', summary: null }
  }

  const supabase = createClient(url, anon)
  const prev = getPreviousPeriod(startDate, endDate)
  if (!prev.startDate || !prev.endDate) return { ok: false, reason: 'Invalid date range' }

  // Tight caps: enough to answer questions, not enough to hang.
  const factor = Math.max(1, ids.length)
  const caps = {
    workOrders: Math.max(500, Math.floor(2500 / factor)),
    snapshots: Math.max(800, Math.floor(3500 / factor)),
    ratings: Math.max(500, Math.floor(2000 / factor)),
  }

  const [propsRes, occNowRes, occPrevRes, ratingsNowRes, ratingsPrevRes, woNowRes, woPrevRes] = await Promise.all([
    supabase.from('properties').select('property_id, name').in('property_id', ids).order('name').limit(100),
    supabase
      .from('occupancy_snapshots')
      .select('property_id, occupied_units, vacant_units, leased_units')
      .in('property_id', ids)
      .gte('snapshot_date', startDate)
      .lte('snapshot_date', endDate)
      .order('snapshot_date', { ascending: false })
      .limit(caps.snapshots),
    supabase
      .from('occupancy_snapshots')
      .select('property_id, occupied_units, vacant_units, leased_units')
      .in('property_id', ids)
      .gte('snapshot_date', prev.startDate)
      .lte('snapshot_date', prev.endDate)
      .order('snapshot_date', { ascending: false })
      .limit(caps.snapshots),
    supabase
      .from('resident_ratings')
      .select('property_id, rating_value')
      .in('property_id', ids)
      .gte('rating_month', startDate)
      .lte('rating_month', endDate)
      .order('rating_month', { ascending: false })
      .limit(caps.ratings),
    supabase
      .from('resident_ratings')
      .select('property_id, rating_value')
      .in('property_id', ids)
      .gte('rating_month', prev.startDate)
      .lte('rating_month', prev.endDate)
      .order('rating_month', { ascending: false })
      .limit(caps.ratings),
    supabase
      .from('work_orders')
      .select('property_id, created_on, completed_on')
      .in('property_id', ids)
      .gte('created_on', startDate)
      .lte('created_on', endDate)
      .order('created_on', { ascending: false })
      .limit(caps.workOrders),
    supabase
      .from('work_orders')
      .select('property_id, created_on, completed_on')
      .in('property_id', ids)
      .gte('created_on', prev.startDate)
      .lte('created_on', prev.endDate)
      .order('created_on', { ascending: false })
      .limit(caps.workOrders),
  ])

  const anyErr =
    propsRes.error || occNowRes.error || occPrevRes.error || ratingsNowRes.error || ratingsPrevRes.error || woNowRes.error || woPrevRes.error
  if (anyErr) {
    return { ok: false, reason: 'Supabase query error', details: String(anyErr.message || anyErr) }
  }

  const propNames = (propsRes.data || []).map((p) => p.name || 'Unknown property').slice(0, 25)

  const calcOccPct = (rows) => {
    let occ = 0
    let vac = 0
    let leased = 0
    for (const r of rows || []) {
      occ += asNumber(r.occupied_units) || 0
      vac += asNumber(r.vacant_units) || 0
      leased += asNumber(r.leased_units) || 0
    }
    const total = occ + vac + leased
    return total > 0 ? (occ / total) * 100 : null
  }

  const calcAvgRating = (rows) => {
    const vals = (rows || []).map((r) => asNumber(r.rating_value)).filter((x) => typeof x === 'number')
    if (!vals.length) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  const calcAvgWoDays = (rows) => {
    const days = []
    for (const r of rows || []) {
      if (!r.created_on || !r.completed_on) continue
      const a = new Date(r.created_on).getTime()
      const b = new Date(r.completed_on).getTime()
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue
      const d = (b - a) / (1000 * 60 * 60 * 24)
      if (Number.isFinite(d) && d >= 0 && d <= 365) days.push(d)
    }
    if (!days.length) return null
    return days.reduce((a, b) => a + b, 0) / days.length
  }

  const summary = {
    properties: { count: ids.length, names: propNames },
    dateRange: { startDate, endDate, previous: prev },
    kpis: {
      occupancyPct: calcOccPct(occNowRes.data),
      occupancyPctPrev: calcOccPct(occPrevRes.data),
      residentSatisfaction: calcAvgRating(ratingsNowRes.data),
      residentSatisfactionPrev: calcAvgRating(ratingsPrevRes.data),
      avgWorkOrderCompletionDays: calcAvgWoDays(woNowRes.data),
      avgWorkOrderCompletionDaysPrev: calcAvgWoDays(woPrevRes.data),
      workOrdersCount: (woNowRes.data || []).length,
      workOrdersPrevCount: (woPrevRes.data || []).length,
    },
    caps,
  }

  return { ok: true, summary }
}

export default async function handler(req, res) {
  // Basic CORS (same-origin in Vercel, but harmless)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(501).json({ error: 'OPENAI_API_KEY is not configured' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const messages = Array.isArray(body?.messages) ? body.messages : []
    const mode = body?.mode === 'spend' ? 'spend' : body?.mode === 'workflows' ? 'workflows' : 'general'
    const ctx = body?.context || {}
    const spendContext = ctx?.spendContext || {}

    const metricsCtx = mode === 'spend' ? null : await buildMetricsContext({
      selectedPropertyIds: ctx?.selectedPropertyIds,
      dateRange: ctx?.dateRange,
    })

    const system =
      mode === 'spend'
        ? `You are JOYAI, a sourcing assistant for property management. You help users create and manage sourcing events (RFx).

Event types: RFQ = Request for Quote (price-focused), RFP = Request for Proposal (solution-focused, e.g. projects, design), RFI = Request for Information (discovery, no commitment).

Current context: ${spendContext?.eventId ? `User is viewing event ${spendContext.eventId}` + (spendContext?.eventName ? ` (${spendContext.eventName})` : '') : 'User is on dashboard or events list'}.

When the user wants to CREATE an event: use create_sourcing_event. The event name MUST be the project or scope they describe — the thing the RFx is for. Examples: "create an RFP for a new dog park" → name "New Dog Park"; "create an RFP for HVAC replacement" → name "HVAC Replacement"; "create RFQ for lobby renovation" → name "Lobby Renovation". NEVER use articles alone (e.g. "an", "a", "the") as the name. Always extract the full descriptive noun phrase. Infer RFQ/RFP/RFI from context: use RFP for design, renovation, or complex projects; RFQ for price quotes; RFI for discovery. Parse budget if mentioned (e.g. $50k, 100000, $2.5M).

When the user wants to change status (open for bidding, submit for approval, start evaluation, recommend award, close/complete): use update_event_status. Use eventIdOrName from context if they say "this event" or "it", otherwise extract the event name from their message.

Always respond with a brief, friendly confirmation and ask them to say "yes" to confirm before executing.`
        : mode === 'workflows'
          ? 'You are JOYAI, an assistant that helps property teams design operational workflows. Be concise, practical, and structured.'
          : 'You are JOYAI, an assistant for property and portfolio analysis. Use the provided context when available. If context is missing or insufficient, say so and answer best-effort with clear assumptions. Be concise and pragmatic.'

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    const spendTools =
      mode === 'spend'
        ? [
            {
              type: 'function',
              function: {
                name: 'create_sourcing_event',
                description: 'Create a new sourcing event (RFQ, RFP, or RFI). Use when the user wants to create, set up, or start a new sourcing/procurement event.',
                parameters: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'The project or scope the event is for — the full noun phrase after "for" (e.g. "New Dog Park", "HVAC Replacement"). Never use articles alone like "an" or "a".' },
                    eventType: { type: 'string', enum: ['RFQ', 'RFP', 'RFI'], description: 'RFQ for quotes, RFP for proposals/projects, RFI for information' },
                    budget: { type: 'number', description: 'Budget in USD if mentioned, else omit' },
                  },
                  required: ['name', 'eventType'],
                  additionalProperties: false,
                },
              },
            },
            {
              type: 'function',
              function: {
                name: 'update_event_status',
                description: 'Update an existing sourcing event status. Use when user wants to open for bidding, submit for approval, start evaluation, recommend award, or close/complete an event.',
                parameters: {
                  type: 'object',
                  properties: {
                    eventIdOrName: {
                      type: 'string',
                      description:
                        'Event ID (if from context) or event name to match (e.g. "Parking Lot Resurfacing", "HVAC"). Use context eventId/eventName if user says "this event" or "it".',
                    },
                    newStatus: {
                      type: 'string',
                      enum: ['Open', 'Pending Approval', 'Under Review', 'Award Pending', 'Completed'],
                      description:
                        'Open=open for bidding, Pending Approval=submit for approval, Under Review=start evaluation, Award Pending=recommend award, Completed=close/complete',
                    },
                  },
                  required: ['eventIdOrName', 'newStatus'],
                  additionalProperties: false,
                },
              },
            },
          ]
        : null

    const contextMessage =
      mode === 'workflows'
        ? null
        : mode === 'spend'
          ? null
          : {
              role: 'system',
              content:
                `Context (may be partial; do not invent extra data):\n` +
                `- current_path: ${typeof ctx?.path === 'string' ? ctx.path : 'unknown'}\n` +
                `- filters: properties=${Array.isArray(ctx?.selectedPropertyIds) ? ctx.selectedPropertyIds.length : 0}\n` +
                `- metrics_summary: ${JSON.stringify(metricsCtx || {}).slice(0, 8000)}`,
            }

    const payload = {
      model,
      temperature: 0.4,
      messages: [{ role: 'system', content: system }, ...(contextMessage ? [contextMessage] : []), ...messages].slice(-30),
      ...(spendTools ? { tools: spendTools, tool_choice: 'auto' } : {}),
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return res.status(502).json({ error: 'OpenAI request failed', status: response.status, details: text.slice(0, 2000) })
    }

    const data = await response.json()
    const msg = data?.choices?.[0]?.message
    let content = typeof msg?.content === 'string' ? msg.content.trim() : ''
    const toolCalls = Array.isArray(msg?.tool_calls) ? msg.tool_calls : []

    let pendingAction = null
    if (mode === 'spend' && toolCalls.length > 0) {
      const tc = toolCalls[0]
      const fn = tc?.function
      const name = fn?.name
      let args = {}
      try {
        args = typeof fn?.arguments === 'string' ? JSON.parse(fn.arguments) : {}
      } catch (_) {}

      if (name === 'create_sourcing_event' && args.name && args.eventType) {
        let eventName = String(args.name).trim()
        const badNames = ['an', 'a', 'the', 'it', 'this']
        if (badNames.includes(eventName.toLowerCase()) || eventName.length < 3) {
          const lastUser = [...messages].reverse().find((m) => m.role === 'user')
          const text = lastUser?.content || ''
          const forMatch = text.match(/(?:for|about)\s+["']?([^"']+?)(?:["']|\s*$)/i)
          if (forMatch && forMatch[1]) {
            let extracted = forMatch[1].trim().replace(/^(an?\s+)|^(the\s+)/i, '')
            if (extracted.length > 2) eventName = extracted.replace(/\b\w/g, (c) => c.toUpperCase())
          }
        }
        if (eventName.length < 2) eventName = 'New Sourcing Event'
        pendingAction = {
          type: 'create_event',
          name: eventName,
          eventType: ['RFQ', 'RFP', 'RFI'].includes(args.eventType) ? args.eventType : 'RFQ',
          budget: typeof args.budget === 'number' && Number.isFinite(args.budget) ? args.budget : undefined,
        }
      } else if (name === 'update_event_status' && args.eventIdOrName && args.newStatus) {
        const valid = ['Open', 'Pending Approval', 'Under Review', 'Award Pending', 'Completed']
        pendingAction = {
          type: 'update_status',
          eventIdOrName: String(args.eventIdOrName).trim(),
          newStatus: valid.includes(args.newStatus) ? args.newStatus : 'Open',
        }
      }

      if (pendingAction && !content) {
        if (pendingAction.type === 'create_event') {
          content = `I'll create a **${pendingAction.eventType}** sourcing event: **${pendingAction.name}**${pendingAction.budget ? ` (budget: $${Number(pendingAction.budget).toLocaleString()})` : ''}.\n\nSay **yes** to create it.`
        } else {
          content = `I'll update **${pendingAction.eventIdOrName}** to ${pendingAction.newStatus}.\n\nSay **yes** to confirm.`
        }
      }
    }

    if (!content) {
      return res.status(502).json({ error: 'Empty response from OpenAI' })
    }

    const json = pendingAction ? { content, pendingAction } : { content }
    return res.status(200).json(json)
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: String(err?.message || err) })
  }
}

