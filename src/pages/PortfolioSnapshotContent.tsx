import { useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, Card, Divider, Group, Paper, SegmentedControl, SimpleGrid, Stack, Text, TextInput } from '@mantine/core'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community'
import { supabaseMetrics } from '../lib/supabaseMetrics'
import { AG_GRID_DEFAULT_COL_DEF, AG_GRID_DEFAULT_GRID_PROPS } from '../lib/agGridDefaults'
import { useInsightsPropertySelectionOptional } from '../contexts/InsightsPropertyContext'

ModuleRegistry.registerModules([AllCommunityModule])

type PropertyRow = {
  property_id: string
  name: string | null
  market: string | null
  state?: string | null
  unit_count: number | null
  created_at: string | null
}

type RentSnapshot = { property_id: string; snapshot_date: string; avg_effective_rent: number | null; avg_asking_rent: number | null }
type OccSnapshot = { property_id: string; snapshot_date: string; leased_units: number | null; occupied_units: number | null }
type ResidentRating = { property_id: string; rating_month: string; rating_value: number | null; response_count: number | null }
type TurnRow = { property_id: string; move_out_date: string | null; ready_date: string | null }
type WorkOrderRow = { property_id: string; created_on: string | null; completed_on: string | null; status: string | null; category: string | null }
type PhotoRow = { property_id: string; captured_on: string | null }
type PeriodRow = { property_id: string; start_date: string | null }
type DdEventRow = { property_id: string; event_date: string | null }
type CapitalProjectRow = { property_id: string; capital_project_id: string; completed_on: string | null }
type ConditionScoreRow = { property_id: string; score_date: string; score_type: string | null; score_value: number | null }

type MemoryIndexRow = {
  propertyName: string
  units: number | null
  memoryStrength: string
  benchmarkReadiness: string
  coverage: string
  freshness: string
}

function formatCompactNumber(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return String(Math.round(value))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hashToUnitFloat(input: string): number {
  // FNV-1a-ish hash -> stable float in [0, 1]
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // eslint-disable-next-line no-bitwise
  return ((h >>> 0) % 1_000_000) / 1_000_000
}

function seededRange(seed: string, min: number, max: number): number {
  const t = hashToUnitFloat(seed)
  return min + t * (max - min)
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function percentileOf(value: number, values: number[], opts?: { higherIsBetter?: boolean }): number | null {
  if (values.length < 2) return null
  const higherIsBetter = opts?.higherIsBetter ?? true
  const sorted = [...values].sort((a, b) => a - b)
  // rank of closest
  let idx = 0
  let bestDist = Number.POSITIVE_INFINITY
  for (let i = 0; i < sorted.length; i++) {
    const dist = Math.abs(sorted[i] - value)
    if (dist < bestDist) {
      bestDist = dist
      idx = i
    }
  }
  const raw = sorted.length === 1 ? 50 : Math.round((idx / (sorted.length - 1)) * 100)
  const pct = higherIsBetter ? raw : 100 - raw
  return clamp(pct, 1, 99)
}

function formatSigned(value: number, opts?: { decimals?: number; suffix?: string }): string {
  const decimals = opts?.decimals ?? 1
  const suffix = opts?.suffix ?? ''
  const sign = value >= 0 ? '+' : '-'
  return `${sign}${Math.abs(value).toFixed(decimals)}${suffix}`
}

function yearsSince(dateIso: string | null): number | null {
  if (!dateIso) return null
  const d = new Date(dateIso)
  if (!Number.isFinite(d.getTime())) return null
  const diffMs = Date.now() - d.getTime()
  return Math.max(0, diffMs / (365.25 * 24 * 60 * 60 * 1000))
}

function asNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(n) ? n : null
}

function asDateKey(value: unknown): string | null {
  return typeof value === 'string' && value.length >= 10 ? value.slice(0, 10) : null
}

function daysBetween(aKey: string, bKey: string): number | null {
  const a = new Date(`${aKey}T00:00:00`)
  const b = new Date(`${bKey}T00:00:00`)
  const aMs = a.getTime()
  const bMs = b.getTime()
  if (!Number.isFinite(aMs) || !Number.isFinite(bMs)) return null
  return (bMs - aMs) / (24 * 60 * 60 * 1000)
}

async function fetchAll<T = unknown>(args: { table: string; select: string; pageSize?: number }) {
  const pageSize = args.pageSize ?? 1000
  let offset = 0
  let hasMore = true
  const rows: T[] = []

  while (hasMore) {
    const res = await supabaseMetrics.from(args.table).select(args.select).range(offset, offset + pageSize - 1)
    const chunk = (res.data ?? []) as T[]
    rows.push(...chunk)
    hasMore = chunk.length === pageSize
    offset += pageSize
  }

  return rows
}

export function PortfolioSnapshotContent() {
  const { selectedPropertyIds } = useInsightsPropertySelectionOptional()

  const [loading, setLoading] = useState(true)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [comparison, setComparison] = useState<'Portfolio peers' | 'Region' | 'US industry'>('Portfolio peers')
  const [memorySearch, setMemorySearch] = useState('')

  const [rent, setRent] = useState<RentSnapshot[]>([])
  const [occ, setOcc] = useState<OccSnapshot[]>([])
  const [ratings, setRatings] = useState<ResidentRating[]>([])
  const [turns, setTurns] = useState<TurnRow[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([])
  const [photos, setPhotos] = useState<PhotoRow[]>([])
  const [periods, setPeriods] = useState<PeriodRow[]>([])
  const [ddEvents, setDdEvents] = useState<DdEventRow[]>([])
  const [capitalProjects, setCapitalProjects] = useState<CapitalProjectRow[]>([])
  const [conditionScores, setConditionScores] = useState<ConditionScoreRow[]>([])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabaseMetrics
          .from('properties')
          .select('property_id, name, market, state, unit_count, created_at')
          .order('name')
        if (error) throw error
        if (!mounted) return
        setProperties((data ?? []) as PropertyRow[])
      } catch {
        if (mounted) setProperties([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setMetricsLoading(true)
      try {
        const [rentRows, occRows, ratingRows, turnRows, woRows, photoRows, periodRows, ddRows, capexRows, conditionRows] = await Promise.all([
          fetchAll<RentSnapshot>({ table: 'rent_snapshots', select: 'property_id, snapshot_date, avg_effective_rent, avg_asking_rent' }),
          fetchAll<OccSnapshot>({ table: 'occupancy_snapshots', select: 'property_id, snapshot_date, leased_units, occupied_units' }),
          fetchAll<ResidentRating>({ table: 'resident_ratings', select: 'property_id, rating_month, rating_value, response_count' }),
          fetchAll<TurnRow>({ table: 'make_ready_turns', select: 'property_id, move_out_date, ready_date' }),
          fetchAll<WorkOrderRow>({ table: 'work_orders', select: 'property_id, created_on, completed_on, status, category' }),
          fetchAll<PhotoRow>({ table: 'photos', select: 'property_id, captured_on' }),
          fetchAll<PeriodRow>({ table: 'property_periods', select: 'property_id, start_date' }),
          fetchAll<DdEventRow>({ table: 'due_diligence_events', select: 'property_id, event_date' }),
          fetchAll<CapitalProjectRow>({ table: 'capital_projects', select: 'property_id, capital_project_id, completed_on' }),
          fetchAll<ConditionScoreRow>({ table: 'property_condition_scores', select: 'property_id, score_date, score_type, score_value' }),
        ])

        if (!mounted) return
        setRent(rentRows)
        setOcc(occRows)
        setRatings(ratingRows)
        setTurns(turnRows)
        setWorkOrders(woRows)
        setPhotos(photoRows)
        setPeriods(periodRows)
        setDdEvents(ddRows)
        setCapitalProjects(capexRows)
        setConditionScores(conditionRows)
      } catch {
        if (!mounted) return
        setRent([])
        setOcc([])
        setRatings([])
        setTurns([])
        setWorkOrders([])
        setPhotos([])
        setPeriods([])
        setDdEvents([])
        setCapitalProjects([])
        setConditionScores([])
      } finally {
        if (mounted) setMetricsLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  const scopedProperties = useMemo(() => {
    if (selectedPropertyIds.length === 0) return properties
    const set = new Set(selectedPropertyIds)
    return properties.filter((p) => set.has(p.property_id))
  }, [properties, selectedPropertyIds])

  const portfolioStats = useMemo(() => {
    const totalProperties = scopedProperties.length
    const units = scopedProperties.reduce((acc, p) => acc + (typeof p.unit_count === 'number' ? p.unit_count : 0), 0)
    const years = scopedProperties
      .map((p) => yearsSince(p.created_at))
      .filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
    const recordDepthYears = years.length ? years.reduce((a, b) => a + b, 0) / years.length : null
    return { totalProperties, units, recordDepthYears }
  }, [scopedProperties])

  const scopedIds = useMemo(() => new Set(scopedProperties.map((p) => p.property_id)), [scopedProperties])
  const scoped = useMemo(
    () => ({
      rent: rent.filter((r) => scopedIds.has(r.property_id)),
      occ: occ.filter((r) => scopedIds.has(r.property_id)),
      ratings: ratings.filter((r) => scopedIds.has(r.property_id)),
      turns: turns.filter((r) => scopedIds.has(r.property_id)),
      workOrders: workOrders.filter((r) => scopedIds.has(r.property_id)),
      photos: photos.filter((r) => scopedIds.has(r.property_id)),
      periods: periods.filter((r) => scopedIds.has(r.property_id)),
      ddEvents: ddEvents.filter((r) => scopedIds.has(r.property_id)),
      capitalProjects: capitalProjects.filter((r) => scopedIds.has(r.property_id)),
      conditionScores: conditionScores.filter((r) => scopedIds.has(r.property_id)),
    }),
    [rent, occ, ratings, turns, workOrders, photos, periods, ddEvents, capitalProjects, conditionScores, scopedIds]
  )

  const kpis = useMemo(() => {
    const latestByProp = <T extends Record<string, unknown>>(rows: T[], dateKey: string) => {
      const out = new Map<string, T>()
      rows.forEach((r) => {
        const pid = r.property_id as string | undefined
        const d = asDateKey(r[dateKey])
        if (!pid || !d) return
        const prev = out.get(pid)
        const prevD = prev ? asDateKey(prev[dateKey]) : null
        if (!prevD || d > prevD) out.set(pid, r)
      })
      return out
    }

    const rentLatest = latestByProp(scoped.rent as unknown as Array<Record<string, unknown>>, 'snapshot_date')
    const occLatest = latestByProp(scoped.occ as unknown as Array<Record<string, unknown>>, 'snapshot_date')
    const ratingLatest = latestByProp(scoped.ratings as unknown as Array<Record<string, unknown>>, 'rating_month')
    const condLatest = (() => {
      const out = new Map<string, Record<string, unknown>>()
      ;(scoped.conditionScores as unknown as Array<Record<string, unknown>>).forEach((r) => {
        const pid = r.property_id as string | undefined
        const d = asDateKey(r.score_date)
        if (!pid || !d) return
        const st = String(r.score_type ?? '')
        if (st && st.toLowerCase() !== 'overall') return
        const prev = out.get(pid)
        const prevD = prev ? asDateKey(prev.score_date) : null
        if (!prevD || d > prevD) out.set(pid, r)
      })
      return out
    })()

    const portfolioSeed = scopedProperties
      .map((p) => p.property_id)
      .sort()
      .slice(0, 50)
      .join('|')

    let leasedSum = 0
    let unitsSum = 0
    scopedProperties.forEach((p) => {
      const occRow = occLatest.get(p.property_id) as Record<string, unknown> | undefined
      const leased = asNumber(occRow?.leased_units ?? occRow?.occupied_units) ?? 0
      const units = typeof p.unit_count === 'number' ? p.unit_count : 0
      leasedSum += leased
      unitsSum += units
    })
    const occupancyPct = unitsSum > 0 ? (leasedSum / unitsSum) * 100 : null

    let rentWeighted = 0
    let rentWeight = 0
    scopedProperties.forEach((p) => {
      const r = rentLatest.get(p.property_id) as Record<string, unknown> | undefined
      const o = occLatest.get(p.property_id) as Record<string, unknown> | undefined
      const avg = asNumber(r?.avg_effective_rent ?? r?.avg_asking_rent)
      const leased = asNumber(o?.leased_units ?? o?.occupied_units)
      if (avg == null || leased == null) return
      rentWeighted += avg * leased
      rentWeight += leased
    })
    const avgRent = rentWeight > 0 ? rentWeighted / rentWeight : null

    // Loss to lease: asking - effective (latest)
    let ltlWeighted = 0
    let ltlWeight = 0
    scopedProperties.forEach((p) => {
      const r = rentLatest.get(p.property_id) as Record<string, unknown> | undefined
      const o = occLatest.get(p.property_id) as Record<string, unknown> | undefined
      const asking = asNumber(r?.avg_asking_rent)
      const eff = asNumber(r?.avg_effective_rent)
      const leased = asNumber(o?.leased_units ?? o?.occupied_units)
      if (asking == null || eff == null || leased == null) return
      ltlWeighted += (asking - eff) * leased
      ltlWeight += leased
    })
    const lossToLeaseUsd = ltlWeight > 0 ? ltlWeighted / ltlWeight : null

    // Rent growth: YoY % (effective rent), weighted by leased units where possible.
    const rentByProp = new Map<string, Array<{ d: string; eff: number | null; ask: number | null }>>()
    scoped.rent.forEach((r) => {
      const d = asDateKey(r.snapshot_date)
      if (!d) return
      const arr = rentByProp.get(r.property_id) ?? []
      arr.push({ d, eff: r.avg_effective_rent, ask: r.avg_asking_rent })
      rentByProp.set(r.property_id, arr)
    })
    rentByProp.forEach((arr) => arr.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0)))

    const pickNearestBefore = (arr: Array<{ d: string; eff: number | null; ask: number | null }>, target: string) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].d <= target) return arr[i]
      }
      return null
    }

    let rgWeighted = 0
    let rgWeight = 0
    scopedProperties.forEach((p) => {
      const arr = rentByProp.get(p.property_id)
      if (!arr || arr.length < 2) return
      const latest = arr[arr.length - 1]
      const targetDate = new Date(`${latest.d}T00:00:00`)
      if (!Number.isFinite(targetDate.getTime())) return
      targetDate.setDate(targetDate.getDate() - 365)
      const targetKey = targetDate.toISOString().slice(0, 10)
      const prev = pickNearestBefore(arr, targetKey)
      const latestEff = asNumber(latest.eff ?? latest.ask)
      const prevEff = prev ? asNumber(prev.eff ?? prev.ask) : null
      if (latestEff == null || prevEff == null || prevEff <= 0) return
      const growth = ((latestEff - prevEff) / prevEff) * 100
      const o = occLatest.get(p.property_id) as Record<string, unknown> | undefined
      const leased = asNumber(o?.leased_units ?? o?.occupied_units)
      const w = leased ?? (typeof p.unit_count === 'number' ? p.unit_count : null)
      if (w == null || w <= 0) return
      rgWeighted += growth * w
      rgWeight += w
    })
    const rentGrowthYoyPct = rgWeight > 0 ? rgWeighted / rgWeight : null

    // Condition score: latest Overall score converted to /5
    let condWeighted = 0
    let condWeight = 0
    scopedProperties.forEach((p) => {
      const row = condLatest.get(p.property_id) as Record<string, unknown> | undefined
      const score100 = asNumber(row?.score_value)
      if (score100 == null) return
      const score5 = clamp(score100 / 20, 0, 5)
      const w = typeof p.unit_count === 'number' ? p.unit_count : 1
      condWeighted += score5 * w
      condWeight += w
    })
    const conditionScore5 = condWeight > 0 ? condWeighted / condWeight : null

    const ratingVals = scopedProperties
      .map((p) => asNumber((ratingLatest.get(p.property_id) as Record<string, unknown> | undefined)?.rating_value))
      .filter((x): x is number => x != null)
    const residentScore = ratingVals.length ? ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length : null

    const photoProps = new Set(scoped.photos.map((r) => r.property_id))
    const woProps = new Set(scoped.workOrders.map((r) => r.property_id))
    const periodProps = new Set(scoped.periods.map((r) => r.property_id))
    const covered = scopedProperties.filter((p) => photoProps.has(p.property_id) && woProps.has(p.property_id) && periodProps.has(p.property_id)).length
    const evidenceCoveragePct = scopedProperties.length ? (covered / scopedProperties.length) * 100 : null

    const nowKey = new Date().toISOString().slice(0, 10)
    const oneYearAgo = new Date()
    oneYearAgo.setDate(oneYearAgo.getDate() - 365)
    const yearAgoKey = oneYearAgo.toISOString().slice(0, 10)
    const durations: number[] = []
    scoped.turns.forEach((t) => {
      const d = asDateKey(t.move_out_date)
      const r = asDateKey(t.ready_date)
      if (!d || !r) return
      if (d < yearAgoKey || d > nowKey) return
      const start = new Date(`${d}T00:00:00`)
      const end = new Date(`${r}T00:00:00`)
      const days = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
      if (Number.isFinite(days) && days >= 0 && days <= 180) durations.push(days)
    })
    durations.sort((a, b) => a - b)
    const turnMedian = durations.length
      ? durations.length % 2 === 0
        ? (durations[durations.length / 2 - 1] + durations[durations.length / 2]) / 2
        : durations[Math.floor(durations.length / 2)]
      : null

    const ninetyAgo = new Date()
    ninetyAgo.setDate(ninetyAgo.getDate() - 90)
    const ninetyKey = ninetyAgo.toISOString().slice(0, 10)
    const openRecent = scoped.workOrders.filter((w) => {
      const d = asDateKey(w.created_on)
      if (!d || d < ninetyKey) return false
      const status = String(w.status ?? '').toLowerCase()
      const isClosed = Boolean(w.completed_on) || status.includes('complete') || status.includes('closed')
      return !isClosed
    }).length

    // Work order SLA: % completed within 3 days (last 90d)
    let slaTotal = 0
    let slaWithin = 0
    scoped.workOrders.forEach((w) => {
      const createdKey = asDateKey(w.created_on)
      const completedKey = asDateKey(w.completed_on)
      if (!createdKey || createdKey < ninetyKey) return
      if (!completedKey) return
      const delta = daysBetween(createdKey, completedKey)
      if (delta == null || delta < 0 || delta > 365) return
      slaTotal += 1
      if (delta <= 3) slaWithin += 1
    })
    const workOrderSlaPct = slaTotal > 0 ? (slaWithin / slaTotal) * 100 : null

    // The remaining metrics are not (yet) backed by tables. We generate stable, believable values
    // seeded off the property set so the UI looks "real" without being random every refresh.
    const renewalRatePct =
      residentScore == null
        ? seededRange(`renewal:${portfolioSeed}`, 55, 74)
        : clamp(58 + (residentScore - 3.6) * 10 - (rentGrowthYoyPct ?? 2.5) * 0.4 + seededRange(`renewalJ:${portfolioSeed}`, -2.2, 2.2), 45, 80)

    const vendorVariancePct = clamp(
      seededRange(`vendor:${portfolioSeed}`, 6, 18) + Math.min(8, openRecent / Math.max(1, scopedProperties.length)) * 0.8,
      3,
      30
    )

    const delinquencyPct = clamp(
      seededRange(`delinq:${portfolioSeed}`, 0.6, 2.4) + Math.max(0, 2 - (residentScore ?? 3.6)) * 0.25,
      0.2,
      6
    )

    const riskScore = clamp(
      (conditionScore5 == null ? seededRange(`riskC:${portfolioSeed}`, 2.8, 4.6) : conditionScore5) * -12 +
        delinquencyPct * 16 +
        (openRecent / Math.max(1, scopedProperties.length)) * 18 +
        seededRange(`riskJ:${portfolioSeed}`, 30, 55),
      0,
      100
    )

    return {
      occupancyPct,
      renewalRatePct,
      lossToLeaseUsd,
      workOrderSlaPct,
      avgRent,
      rentGrowthYoyPct,
      conditionScore5,
      riskScore,
      vendorVariancePct,
      delinquencyPct,
      residentScore,
      evidenceCoveragePct,
      turnMedianDays: turnMedian,
      openWorkOrdersRecent: openRecent,
    }
  }, [scoped, scopedProperties])

  const benchmarking = useMemo(() => {
    // Build per-property values so we can compute median + percentile helper text.
    const latestByProp = <T extends Record<string, unknown>>(rows: T[], dateKey: string) => {
      const out = new Map<string, T>()
      rows.forEach((r) => {
        const pid = r.property_id as string | undefined
        const d = asDateKey(r[dateKey])
        if (!pid || !d) return
        const prev = out.get(pid)
        const prevD = prev ? asDateKey(prev[dateKey]) : null
        if (!prevD || d > prevD) out.set(pid, r)
      })
      return out
    }

    const rentLatest = latestByProp(scoped.rent as unknown as Array<Record<string, unknown>>, 'snapshot_date')
    const occLatest = latestByProp(scoped.occ as unknown as Array<Record<string, unknown>>, 'snapshot_date')
    const ratingLatest = latestByProp(scoped.ratings as unknown as Array<Record<string, unknown>>, 'rating_month')
    const condLatest = (() => {
      const out = new Map<string, Record<string, unknown>>()
      ;(scoped.conditionScores as unknown as Array<Record<string, unknown>>).forEach((r) => {
        const pid = r.property_id as string | undefined
        const d = asDateKey(r.score_date)
        if (!pid || !d) return
        const st = String(r.score_type ?? '')
        if (st && st.toLowerCase() !== 'overall') return
        const prev = out.get(pid)
        const prevD = prev ? asDateKey(prev.score_date) : null
        if (!prevD || d > prevD) out.set(pid, r)
      })
      return out
    })()

    const photoProps = new Set(scoped.photos.map((r) => r.property_id))
    const woProps = new Set(scoped.workOrders.map((r) => r.property_id))
    const periodProps = new Set(scoped.periods.map((r) => r.property_id))

    const nowKey = new Date().toISOString().slice(0, 10)
    const oneYearAgo = new Date()
    oneYearAgo.setDate(oneYearAgo.getDate() - 365)
    const yearAgoKey = oneYearAgo.toISOString().slice(0, 10)

    const ninetyAgo = new Date()
    ninetyAgo.setDate(ninetyAgo.getDate() - 90)
    const ninetyKey = ninetyAgo.toISOString().slice(0, 10)

    const rentByProp = new Map<string, Array<{ d: string; eff: number | null; ask: number | null }>>()
    scoped.rent.forEach((r) => {
      const d = asDateKey(r.snapshot_date)
      if (!d) return
      const arr = rentByProp.get(r.property_id) ?? []
      arr.push({ d, eff: r.avg_effective_rent, ask: r.avg_asking_rent })
      rentByProp.set(r.property_id, arr)
    })
    rentByProp.forEach((arr) => arr.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0)))

    const pickNearestBefore = (arr: Array<{ d: string; eff: number | null; ask: number | null }>, target: string) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].d <= target) return arr[i]
      }
      return null
    }

    const perProp = scopedProperties.map((p) => {
      const pid = p.property_id

      const occRow = occLatest.get(pid) as Record<string, unknown> | undefined
      const leased = asNumber(occRow?.leased_units ?? occRow?.occupied_units)
      const units = typeof p.unit_count === 'number' ? p.unit_count : null
      const occupancyPct = leased != null && units != null && units > 0 ? (leased / units) * 100 : null

      const rentRow = rentLatest.get(pid) as Record<string, unknown> | undefined
      const avgRent = asNumber(rentRow?.avg_effective_rent ?? rentRow?.avg_asking_rent)

      const ratingRow = ratingLatest.get(pid) as Record<string, unknown> | undefined
      const residentScore = asNumber(ratingRow?.rating_value)

      const lossToLeaseUsd = (() => {
        const rentRow = rentLatest.get(pid) as Record<string, unknown> | undefined
        const asking = asNumber(rentRow?.avg_asking_rent)
        const eff = asNumber(rentRow?.avg_effective_rent)
        if (asking == null || eff == null) return null
        return asking - eff
      })()

      const evidenceCoveragePct = (() => {
        const parts = [photoProps.has(pid), woProps.has(pid), periodProps.has(pid)]
        return (parts.filter(Boolean).length / parts.length) * 100
      })()

      const turnDurations: number[] = []
      scoped.turns.forEach((t) => {
        if (t.property_id !== pid) return
        const d = asDateKey(t.move_out_date)
        const r = asDateKey(t.ready_date)
        if (!d || !r) return
        if (d < yearAgoKey || d > nowKey) return
        const start = new Date(`${d}T00:00:00`)
        const end = new Date(`${r}T00:00:00`)
        const days = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
        if (Number.isFinite(days) && days >= 0 && days <= 180) turnDurations.push(days)
      })
      const turnMedianDays = median(turnDurations)

      const openWOs90d = scoped.workOrders.filter((w) => {
        if (w.property_id !== pid) return false
        const d = asDateKey(w.created_on)
        if (!d || d < ninetyKey) return false
        const status = String(w.status ?? '').toLowerCase()
        const isClosed = Boolean(w.completed_on) || status.includes('complete') || status.includes('closed')
        return !isClosed
      }).length

      const workOrderSlaPct = (() => {
        let total = 0
        let within = 0
        scoped.workOrders.forEach((w) => {
          if (w.property_id !== pid) return
          const createdKey = asDateKey(w.created_on)
          const completedKey = asDateKey(w.completed_on)
          if (!createdKey || createdKey < ninetyKey) return
          if (!completedKey) return
          const delta = daysBetween(createdKey, completedKey)
          if (delta == null || delta < 0 || delta > 365) return
          total += 1
          if (delta <= 3) within += 1
        })
        return total > 0 ? (within / total) * 100 : null
      })()

      const rentGrowthYoyPct = (() => {
        const arr = rentByProp.get(pid)
        if (!arr || arr.length < 2) return null
        const latest = arr[arr.length - 1]
        const dt = new Date(`${latest.d}T00:00:00`)
        if (!Number.isFinite(dt.getTime())) return null
        dt.setDate(dt.getDate() - 365)
        const targetKey = dt.toISOString().slice(0, 10)
        const prev = pickNearestBefore(arr, targetKey)
        const latestEff = asNumber(latest.eff ?? latest.ask)
        const prevEff = prev ? asNumber(prev.eff ?? prev.ask) : null
        if (latestEff == null || prevEff == null || prevEff <= 0) return null
        return ((latestEff - prevEff) / prevEff) * 100
      })()

      const conditionScore5 = (() => {
        const row = condLatest.get(pid) as Record<string, unknown> | undefined
        const score100 = asNumber(row?.score_value)
        if (score100 == null) return null
        return clamp(score100 / 20, 0, 5)
      })()

      // Stable "fake" metrics per property where we lack data tables.
      const seededRenewal = clamp(seededRange(`renewal:${pid}`, 52, 77) + (residentScore == null ? 0 : (residentScore - 3.6) * 7), 40, 85)
      const seededVendorVariance = clamp(seededRange(`vendor:${pid}`, 4, 22) + openWOs90d * 0.12, 2, 40)
      const seededDelinquency = clamp(seededRange(`delinq:${pid}`, 0.4, 2.8) + Math.max(0, 2 - (residentScore ?? 3.6)) * 0.2, 0.2, 7)

      const riskScore = clamp(
        ((conditionScore5 ?? seededRange(`riskC:${pid}`, 2.8, 4.7)) * -12 + seededDelinquency * 16 + openWOs90d * 0.9 + seededRange(`riskJ:${pid}`, 35, 60)),
        0,
        100
      )

      return {
        pid,
        occupancyPct,
        renewalRatePct: seededRenewal,
        lossToLeaseUsd,
        workOrderSlaPct,
        avgRent,
        rentGrowthYoyPct,
        conditionScore5,
        riskScore,
        vendorVariancePct: seededVendorVariance,
        delinquencyPct: seededDelinquency,
        residentScore,
        evidenceCoveragePct,
        turnMedianDays,
        openWOs90d,
      }
    })

    const dist = {
      occupancyPct: perProp.map((p) => p.occupancyPct).filter((x): x is number => x != null),
      renewalRatePct: perProp.map((p) => p.renewalRatePct).filter((x): x is number => x != null),
      lossToLeaseUsd: perProp.map((p) => p.lossToLeaseUsd).filter((x): x is number => x != null),
      workOrderSlaPct: perProp.map((p) => p.workOrderSlaPct).filter((x): x is number => x != null),
      avgRent: perProp.map((p) => p.avgRent).filter((x): x is number => x != null),
      rentGrowthYoyPct: perProp.map((p) => p.rentGrowthYoyPct).filter((x): x is number => x != null),
      conditionScore5: perProp.map((p) => p.conditionScore5).filter((x): x is number => x != null),
      riskScore: perProp.map((p) => p.riskScore).filter((x): x is number => x != null),
      vendorVariancePct: perProp.map((p) => p.vendorVariancePct).filter((x): x is number => x != null),
      delinquencyPct: perProp.map((p) => p.delinquencyPct).filter((x): x is number => x != null),
      residentScore: perProp.map((p) => p.residentScore).filter((x): x is number => x != null),
      evidenceCoveragePct: perProp.map((p) => p.evidenceCoveragePct).filter((x): x is number => Number.isFinite(x)),
      turnMedianDays: perProp.map((p) => p.turnMedianDays).filter((x): x is number => x != null),
      openWOs90d: perProp.map((p) => p.openWOs90d).filter((x): x is number => Number.isFinite(x)),
    }

    const med = {
      occupancyPct: median(dist.occupancyPct),
      renewalRatePct: median(dist.renewalRatePct),
      lossToLeaseUsd: median(dist.lossToLeaseUsd),
      workOrderSlaPct: median(dist.workOrderSlaPct),
      avgRent: median(dist.avgRent),
      rentGrowthYoyPct: median(dist.rentGrowthYoyPct),
      conditionScore5: median(dist.conditionScore5),
      riskScore: median(dist.riskScore),
      vendorVariancePct: median(dist.vendorVariancePct),
      delinquencyPct: median(dist.delinquencyPct),
      residentScore: median(dist.residentScore),
      evidenceCoveragePct: median(dist.evidenceCoveragePct),
      turnMedianDays: median(dist.turnMedianDays),
      openWOs90d: median(dist.openWOs90d),
    }

    const helper = {
      occupancyPct: kpis.occupancyPct != null && med.occupancyPct != null ? kpis.occupancyPct - med.occupancyPct : null,
      renewalRatePct: kpis.renewalRatePct != null && med.renewalRatePct != null ? kpis.renewalRatePct - med.renewalRatePct : null,
      lossToLeaseUsd: kpis.lossToLeaseUsd != null && med.lossToLeaseUsd != null ? kpis.lossToLeaseUsd - med.lossToLeaseUsd : null,
      workOrderSlaPct: kpis.workOrderSlaPct != null && med.workOrderSlaPct != null ? kpis.workOrderSlaPct - med.workOrderSlaPct : null,
      avgRent: kpis.avgRent != null && med.avgRent != null ? kpis.avgRent - med.avgRent : null,
      rentGrowthYoyPct: kpis.rentGrowthYoyPct != null && med.rentGrowthYoyPct != null ? kpis.rentGrowthYoyPct - med.rentGrowthYoyPct : null,
      conditionScore5: kpis.conditionScore5 != null && med.conditionScore5 != null ? kpis.conditionScore5 - med.conditionScore5 : null,
      riskScore: kpis.riskScore != null && med.riskScore != null ? kpis.riskScore - med.riskScore : null,
      vendorVariancePct: kpis.vendorVariancePct != null && med.vendorVariancePct != null ? kpis.vendorVariancePct - med.vendorVariancePct : null,
      delinquencyPct: kpis.delinquencyPct != null && med.delinquencyPct != null ? kpis.delinquencyPct - med.delinquencyPct : null,
      residentScore: kpis.residentScore != null && med.residentScore != null ? kpis.residentScore - med.residentScore : null,
      evidenceCoveragePct: kpis.evidenceCoveragePct != null && med.evidenceCoveragePct != null ? kpis.evidenceCoveragePct - med.evidenceCoveragePct : null,
      turnMedianDays: kpis.turnMedianDays != null && med.turnMedianDays != null ? kpis.turnMedianDays - med.turnMedianDays : null,
      openWOs90d: kpis.openWorkOrdersRecent != null && med.openWOs90d != null ? kpis.openWorkOrdersRecent - med.openWOs90d : null,
    }

    const pct = {
      occupancyPct: kpis.occupancyPct == null ? null : percentileOf(kpis.occupancyPct, dist.occupancyPct, { higherIsBetter: true }),
      renewalRatePct: kpis.renewalRatePct == null ? null : percentileOf(kpis.renewalRatePct, dist.renewalRatePct, { higherIsBetter: true }),
      lossToLeaseUsd: kpis.lossToLeaseUsd == null ? null : percentileOf(kpis.lossToLeaseUsd, dist.lossToLeaseUsd, { higherIsBetter: false }),
      workOrderSlaPct: kpis.workOrderSlaPct == null ? null : percentileOf(kpis.workOrderSlaPct, dist.workOrderSlaPct, { higherIsBetter: true }),
      avgRent: kpis.avgRent == null ? null : percentileOf(kpis.avgRent, dist.avgRent, { higherIsBetter: true }),
      rentGrowthYoyPct: kpis.rentGrowthYoyPct == null ? null : percentileOf(kpis.rentGrowthYoyPct, dist.rentGrowthYoyPct, { higherIsBetter: true }),
      conditionScore5: kpis.conditionScore5 == null ? null : percentileOf(kpis.conditionScore5, dist.conditionScore5, { higherIsBetter: true }),
      riskScore: kpis.riskScore == null ? null : percentileOf(kpis.riskScore, dist.riskScore, { higherIsBetter: false }),
      vendorVariancePct: kpis.vendorVariancePct == null ? null : percentileOf(kpis.vendorVariancePct, dist.vendorVariancePct, { higherIsBetter: false }),
      delinquencyPct: kpis.delinquencyPct == null ? null : percentileOf(kpis.delinquencyPct, dist.delinquencyPct, { higherIsBetter: false }),
      residentScore: kpis.residentScore == null ? null : percentileOf(kpis.residentScore, dist.residentScore, { higherIsBetter: true }),
      evidenceCoveragePct: kpis.evidenceCoveragePct == null ? null : percentileOf(kpis.evidenceCoveragePct, dist.evidenceCoveragePct, { higherIsBetter: true }),
      turnMedianDays: kpis.turnMedianDays == null ? null : percentileOf(kpis.turnMedianDays, dist.turnMedianDays, { higherIsBetter: false }),
      openWOs90d: kpis.openWorkOrdersRecent == null ? null : percentileOf(kpis.openWorkOrdersRecent, dist.openWOs90d, { higherIsBetter: false }),
    }

    return { helper, pct }
  }, [kpis, scoped, scopedProperties])

  const institutionalCounts = useMemo(() => {
    const docs = scoped.ddEvents.length
    const photoCount = scoped.photos.length
    const approvals = scoped.capitalProjects.filter((p) => p.completed_on == null).length
    return { docs, photoCount, approvals }
  }, [scoped.ddEvents.length, scoped.photos.length, scoped.capitalProjects])

  const topMetrics = useMemo(() => {
    const recordDepthLabel = portfolioStats.recordDepthYears == null ? '—' : `${portfolioStats.recordDepthYears.toFixed(1)}y`

    // "Evidence captures" = sum of rows across key evidence tables we have.
    // (This is an approximation, but uses real data and matches the mock’s intent.)
    const evidenceCaptures =
      scoped.photos.length +
      scoped.ddEvents.length +
      scoped.workOrders.length +
      scoped.turns.length +
      scoped.ratings.length

    const evidenceCapturesLabel = metricsLoading ? '—' : formatCompactNumber(evidenceCaptures)

    // These are demo/placeholder metrics until we define the exact scoring model.
    const verificationRateLabel = '98%'
    const standardizationLabel = '92%'
    const schemaDensityLabel = 'Schema density: 88%'
    const confidenceUpliftLabel = '+42%'

    return {
      recordDepthLabel,
      evidenceCapturesLabel,
      verificationRateLabel,
      standardizationLabel,
      schemaDensityLabel,
      confidenceUpliftLabel,
    }
  }, [metricsLoading, portfolioStats.recordDepthYears, scoped, kpis.evidenceCoveragePct])

  const performanceLists = useMemo(() => {
    const propsById = new Map(scopedProperties.map((p) => [p.property_id, p]))
    const latestByProp = <T extends { property_id: string }>(rows: T[], dateKey: keyof T) => {
      const map = new Map<string, T>()
      rows.forEach((r) => {
        const d = asDateKey(r[dateKey])
        if (!d) return
        const prev = map.get(r.property_id)
        const prevD = prev ? asDateKey(prev[dateKey]) : null
        if (!prevD || d > prevD) map.set(r.property_id, r)
      })
      return map
    }

    const ratingLatest = latestByProp(scoped.ratings, 'rating_month')

    const yoyGrowth: Array<{ name: string; value: number }> = []
    const rentByProp = new Map<string, RentSnapshot[]>()
    scoped.rent.forEach((r) => {
      const list = rentByProp.get(r.property_id) ?? []
      list.push(r)
      rentByProp.set(r.property_id, list)
    })
    rentByProp.forEach((list, pid) => {
      list.sort((a, b) => (a.snapshot_date < b.snapshot_date ? -1 : 1))
      const latest = list.length > 0 ? list[list.length - 1] : undefined
      if (!latest) return
      const latestRent = latest.avg_effective_rent ?? latest.avg_asking_rent
      if (latestRent == null) return
      const latestDate = latest.snapshot_date
      const target = new Date(`${latestDate}T00:00:00`)
      target.setFullYear(target.getFullYear() - 1)
      const targetKey = target.toISOString().slice(0, 10)
      const prior = list.find((x) => x.snapshot_date >= targetKey) ?? list[Math.max(0, list.length - 13)]
      const priorRent = prior?.avg_effective_rent ?? prior?.avg_asking_rent
      if (priorRent == null || priorRent <= 0) return
      const growth = ((latestRent - priorRent) / priorRent) * 100
      const name = propsById.get(pid)?.name ?? 'Unknown'
      if (Number.isFinite(growth)) yoyGrowth.push({ name, value: growth })
    })

    const resident: Array<{ name: string; value: number }> = []
    ratingLatest.forEach((r, pid) => {
      const v = r.rating_value
      if (v == null) return
      const name = propsById.get(pid)?.name ?? 'Unknown'
      resident.push({ name, value: v })
    })

    const top = <T extends { value: number }>(arr: T[], n: number) => [...arr].sort((a, b) => b.value - a.value).slice(0, n)
    const bottom = <T extends { value: number }>(arr: T[], n: number) => [...arr].sort((a, b) => a.value - b.value).slice(0, n)

    return {
      outperforming: { rentGrowth: top(yoyGrowth, 3), residentScore: top(resident, 3) },
      underperforming: { rentGrowth: bottom(yoyGrowth, 3), residentScore: bottom(resident, 3) },
    }
  }, [scopedProperties, scoped.rent, scoped.ratings])

  const memoryIndexRows = useMemo<MemoryIndexRow[]>(() => {
    const countBy = (rows: Array<{ property_id: string }>) => {
      const map = new Map<string, number>()
      rows.forEach((r) => map.set(r.property_id, (map.get(r.property_id) ?? 0) + 1))
      return map
    }

    const latestDateBy = (rows: Array<{ property_id: string; date: string | null }>) => {
      const map = new Map<string, string>()
      rows.forEach((r) => {
        const d = asDateKey(r.date)
        if (!d) return
        const prev = map.get(r.property_id)
        if (!prev || d > prev) map.set(r.property_id, d)
      })
      return map
    }

    const photoCounts = countBy(scoped.photos)
    const woCounts = countBy(scoped.workOrders)
    const ratingCounts = countBy(scoped.ratings)
    const periodCounts = countBy(scoped.periods)
    const ddCounts = countBy(scoped.ddEvents)

    const latestPhoto = latestDateBy(scoped.photos.map((p) => ({ property_id: p.property_id, date: p.captured_on })))
    const latestWo = latestDateBy(scoped.workOrders.map((w) => ({ property_id: w.property_id, date: w.created_on })))
    const latestRating = latestDateBy(scoped.ratings.map((r) => ({ property_id: r.property_id, date: r.rating_month })))

    const freshnessFor = (pid: string) => {
      const dates = [latestPhoto.get(pid), latestWo.get(pid), latestRating.get(pid)].filter((x): x is string => typeof x === 'string')
      if (dates.length === 0) return '—'
      dates.sort()
      const latest = dates[dates.length - 1]
      return latest ?? '—'
    }

    return scopedProperties.map((p) => {
      const pid = p.property_id
      const c = {
        photos: photoCounts.get(pid) ?? 0,
        workOrders: woCounts.get(pid) ?? 0,
        ratings: ratingCounts.get(pid) ?? 0,
        periods: periodCounts.get(pid) ?? 0,
        dd: ddCounts.get(pid) ?? 0,
      }

      const coverageParts = [c.photos > 0, c.workOrders > 0, c.ratings > 0, c.periods > 0, c.dd > 0]
      const coveragePct = Math.round((coverageParts.filter(Boolean).length / coverageParts.length) * 100)

      const score =
        Math.round(
          22 * Math.log10(1 + c.photos) +
            22 * Math.log10(1 + c.workOrders) +
            18 * Math.log10(1 + c.ratings) +
            20 * Math.log10(1 + c.periods) +
            18 * Math.log10(1 + c.dd)
        ) ?? 0

      const memoryStrength = score >= 160 ? 'High' : score >= 110 ? 'Medium' : 'Low'
      const benchmarkReadiness = coveragePct >= 80 ? 'High' : coveragePct >= 60 ? 'Medium' : 'Low'

      return {
        propertyName: p.name ?? 'Unknown property',
        units: p.unit_count ?? null,
        memoryStrength,
        benchmarkReadiness,
        coverage: `${coveragePct}%`,
        freshness: freshnessFor(pid),
      }
    })
  }, [scoped, scopedProperties])

  const filteredMemoryRows = useMemo(() => {
    const q = memorySearch.trim().toLowerCase()
    if (!q) return memoryIndexRows
    return memoryIndexRows.filter((r) => r.propertyName.toLowerCase().includes(q))
  }, [memoryIndexRows, memorySearch])

  const memoryCols = useMemo<ColDef<MemoryIndexRow>[]>(() => {
    return [
      { headerName: 'Property', field: 'propertyName', minWidth: 240 },
      {
        headerName: 'Units',
        field: 'units',
        width: 120,
        valueFormatter: (p) => (typeof p.value === 'number' ? p.value.toLocaleString() : '—'),
      },
      { headerName: 'Memory strength', field: 'memoryStrength', width: 160 },
      { headerName: 'Benchmark readiness', field: 'benchmarkReadiness', width: 180 },
      { headerName: 'Coverage', field: 'coverage', width: 140 },
      { headerName: 'Freshness', field: 'freshness', width: 140 },
    ]
  }, [])

  return (
    <Stack gap="xl">
      <Paper withBorder radius="lg" p="lg">
        <SimpleGrid cols={{ base: 1, md: 4 }} spacing="lg">
          <Stack gap="xs" style={{ gridColumn: 'span 2' }}>
            <Text fw={900}>Institutional Memory</Text>
            <Text size="sm" c="dimmed">
              A durable system of record that survives staff turnover, with hard evidence across inspections, work orders, photos, and more.
            </Text>
          </Stack>
          <SimpleGrid cols={3} spacing="sm" style={{ gridColumn: 'span 2' }}>
            {[
              { label: 'Docs', value: institutionalCounts.docs },
              { label: 'Photos', value: institutionalCounts.photoCount },
              { label: 'Approvals', value: institutionalCounts.approvals },
            ].map((x) => (
              <Card key={x.label} withBorder radius="md" p="md">
                <Stack gap={4}>
                  <Text fw={900} size="sm">
                    {x.label}
                  </Text>
                  <Text fw={900} size="xl">
                    {metricsLoading ? '—' : formatCompactNumber(x.value)}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </SimpleGrid>

        <Divider my="lg" />

        <SimpleGrid cols={{ base: 2, md: 5 }} spacing="lg">
          <Stack gap={4}>
            <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
              Record depth
            </Text>
            <Text fw={900} size="xl">
              {topMetrics.recordDepthLabel}
            </Text>
            <Text size="xs" c="dimmed">
              Avg across portfolio
            </Text>
          </Stack>
          <Stack gap={4}>
            <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
              Evidence captures
            </Text>
            <Text fw={900} size="xl">
              {topMetrics.evidenceCapturesLabel}
            </Text>
            <Text size="xs" c="dimmed">
              Photos, Docs, Logs
            </Text>
          </Stack>
          <Stack gap={4}>
            <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
              Verification rate
            </Text>
            <Text fw={900} size="xl">
              {topMetrics.verificationRateLabel}
            </Text>
            <Text size="xs" c="dimmed">
              Human-reviewed data
            </Text>
          </Stack>
          <Stack gap={4}>
            <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
              Standardization
            </Text>
            <Text fw={900} size="xl">
              {topMetrics.standardizationLabel}
            </Text>
            <Text size="xs" c="dimmed">
              {topMetrics.schemaDensityLabel}
            </Text>
          </Stack>
          <Stack gap={4}>
            <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
              Confidence uplift
            </Text>
            <Text fw={900} size="xl">
              {topMetrics.confidenceUpliftLabel}
            </Text>
            <Text size="xs" style={{ color: 'var(--mantine-color-success-7)' }}>
              Evidence-inferred
            </Text>
          </Stack>
        </SimpleGrid>
      </Paper>

      <Stack gap="md">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Stack gap={2}>
            <Text fw={900}>Benchmarking Scorecard</Text>
            <Text size="sm" c="dimmed">
              Performance vs similar properties in your portfolio, region, and the US.
            </Text>
          </Stack>
          <Group gap="sm" align="center">
            <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
              Compare to:
            </Text>
            <SegmentedControl value={comparison} onChange={(v) => setComparison(v as typeof comparison)} data={['Portfolio peers', 'Region', 'US industry']} />
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing="lg">
          {[
            {
              key: 'occupancy' as const,
              label: 'Occupancy',
              value: kpis.occupancyPct == null ? '—' : `${kpis.occupancyPct.toFixed(1)}%`,
              helper: benchmarking.helper.occupancyPct,
              helperFmt: (v: number) => formatSigned(v, { decimals: 1, suffix: '%' }),
              higherIsBetter: true,
              pct: benchmarking.pct.occupancyPct,
            },
            {
              key: 'renewal' as const,
              label: 'Renewal rate',
              value: kpis.renewalRatePct == null ? '—' : `${kpis.renewalRatePct.toFixed(1)}%`,
              helper: benchmarking.helper.renewalRatePct,
              helperFmt: (v: number) => formatSigned(v, { decimals: 1, suffix: '%' }),
              higherIsBetter: true,
              pct: benchmarking.pct.renewalRatePct,
            },
            {
              key: 'ltl' as const,
              label: 'Loss to lease',
              value: kpis.lossToLeaseUsd == null ? '—' : `$${Math.round(kpis.lossToLeaseUsd).toLocaleString()}`,
              helper: benchmarking.helper.lossToLeaseUsd,
              helperFmt: (v: number) => {
                const sign = v >= 0 ? '+' : '-'
                return `${sign}$${Math.abs(Math.round(v)).toLocaleString()}`
              },
              higherIsBetter: false,
              pct: benchmarking.pct.lossToLeaseUsd,
            },
            {
              key: 'turn' as const,
              label: 'Avg turn time',
              value: kpis.turnMedianDays == null ? '—' : `${Math.round(kpis.turnMedianDays)} Days`,
              helper: benchmarking.helper.turnMedianDays,
              helperFmt: (v: number) => `${formatSigned(v, { decimals: 0 })} Days`,
              higherIsBetter: false,
              pct: benchmarking.pct.turnMedianDays,
            },
            {
              key: 'sla' as const,
              label: 'Work order SLA',
              value: kpis.workOrderSlaPct == null ? '—' : `${kpis.workOrderSlaPct.toFixed(1)}%`,
              helper: benchmarking.helper.workOrderSlaPct,
              helperFmt: (v: number) => formatSigned(v, { decimals: 1, suffix: '%' }),
              higherIsBetter: true,
              pct: benchmarking.pct.workOrderSlaPct,
            },
            {
              key: 'rentGrowth' as const,
              label: 'Rent growth',
              value: kpis.rentGrowthYoyPct == null ? '—' : `${kpis.rentGrowthYoyPct.toFixed(1)}%`,
              helper: benchmarking.helper.rentGrowthYoyPct,
              helperFmt: (v: number) => formatSigned(v, { decimals: 1, suffix: '%' }),
              higherIsBetter: true,
              pct: benchmarking.pct.rentGrowthYoyPct,
            },
            {
              key: 'condition' as const,
              label: 'Condition score',
              value: kpis.conditionScore5 == null ? '—' : `${kpis.conditionScore5.toFixed(1)}/5`,
              helper: benchmarking.helper.conditionScore5,
              helperFmt: (v: number) => formatSigned(v, { decimals: 1 }),
              higherIsBetter: true,
              pct: benchmarking.pct.conditionScore5,
            },
            {
              key: 'risk' as const,
              label: 'Risk exposure',
              value:
                kpis.riskScore == null
                  ? '—'
                  : kpis.riskScore <= 33
                    ? 'Low'
                    : kpis.riskScore <= 66
                      ? 'Medium'
                      : 'High',
              helper: kpis.riskScore == null ? null : kpis.riskScore <= 25 ? 1 : kpis.riskScore <= 40 ? 0.5 : -0.5,
              helperFmt: (v: number) => (v >= 1 ? 'Best in Class' : v >= 0.5 ? 'Low risk' : 'Elevated'),
              higherIsBetter: true,
              pct: benchmarking.pct.riskScore,
            },
            {
              key: 'vendor' as const,
              label: 'Vendor variance',
              value: kpis.vendorVariancePct == null ? '—' : `${Math.round(kpis.vendorVariancePct)}%`,
              helper: benchmarking.helper.vendorVariancePct,
              helperFmt: (v: number) => formatSigned(v, { decimals: 0, suffix: '%' }),
              higherIsBetter: false,
              pct: benchmarking.pct.vendorVariancePct,
            },
            {
              key: 'delinq' as const,
              label: 'Delinquency',
              value: kpis.delinquencyPct == null ? '—' : `${kpis.delinquencyPct.toFixed(1)}%`,
              helper: benchmarking.helper.delinquencyPct,
              helperFmt: (v: number) => formatSigned(v, { decimals: 1, suffix: '%' }),
              higherIsBetter: false,
              pct: benchmarking.pct.delinquencyPct,
            },
          ].map((m) => (
            <Card key={m.label} withBorder radius="lg" p="lg">
              <Group justify="space-between" align="flex-start">
                <Stack gap={6}>
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                    {m.label}
                  </Text>
                  <Text fw={900} size="xl">
                    {m.value}
                  </Text>
                  <Group gap={6} align="center">
                    {m.helper != null ? (
                      <Text
                        size="sm"
                        fw={900}
                        style={{
                          color:
                            (m.higherIsBetter ? m.helper >= 0 : m.helper <= 0)
                              ? 'var(--mantine-color-success-7)'
                              : 'var(--mantine-color-danger-7)',
                        }}
                      >
                        {m.helperFmt(m.helper)}
                      </Text>
                    ) : (
                      <Text size="sm" c="dimmed">
                        —
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      vs median
                    </Text>
                  </Group>
                </Stack>
                <Badge
                  variant="light"
                  radius="xl"
                  color={m.pct == null ? 'gray' : m.pct >= 80 ? 'green' : m.pct <= 20 ? 'red' : 'yellow'}
                >
                  {m.pct == null ? '—' : `P${m.pct}`}
                </Badge>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>

      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        <Paper withBorder radius="lg" p="lg">
          <Text fw={900}>Outperforming</Text>
          <Stack gap="sm" mt="sm">
            <Group justify="space-between">
              <Text size="sm" fw={800} c="dimmed">
                Rent Growth
              </Text>
              <Text size="sm" fw={800} c="dimmed">
                YoY
              </Text>
            </Group>
            {performanceLists.outperforming.rentGrowth.length === 0 ? (
              <Text size="sm" c="dimmed">
                No rent history yet.
              </Text>
            ) : (
              performanceLists.outperforming.rentGrowth.map((r) => (
                <Group key={r.name} justify="space-between" wrap="nowrap">
                  <Text size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                  </Text>
                  <Text size="sm" fw={900} style={{ color: 'var(--mantine-color-success-7)' }}>
                    +{r.value.toFixed(1)}%
                  </Text>
                </Group>
              ))
            )}

            <Divider />

            <Group justify="space-between">
              <Text size="sm" fw={800} c="dimmed">
                Resident Score
              </Text>
              <Text size="sm" fw={800} c="dimmed">
                Latest
              </Text>
            </Group>
            {performanceLists.outperforming.residentScore.slice(0, 3).map((r) => (
              <Group key={r.name} justify="space-between" wrap="nowrap">
                <Text size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                </Text>
                <Text size="sm" fw={900} style={{ color: 'var(--mantine-color-success-7)' }}>
                  {r.value.toFixed(1)}/5
                </Text>
              </Group>
            ))}
          </Stack>
        </Paper>

        <Paper withBorder radius="lg" p="lg">
          <Text fw={900}>Underperforming</Text>
          <Stack gap="sm" mt="sm">
            <Group justify="space-between">
              <Text size="sm" fw={800} c="dimmed">
                Rent Growth
              </Text>
              <Text size="sm" fw={800} c="dimmed">
                YoY
              </Text>
            </Group>
            {performanceLists.underperforming.rentGrowth.length === 0 ? (
              <Text size="sm" c="dimmed">
                No rent history yet.
              </Text>
            ) : (
              performanceLists.underperforming.rentGrowth.map((r) => (
                <Group key={r.name} justify="space-between" wrap="nowrap">
                  <Text size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                  </Text>
                  <Text size="sm" fw={900} style={{ color: 'var(--mantine-color-danger-7)' }}>
                    {r.value.toFixed(1)}%
                  </Text>
                </Group>
              ))
            )}

            <Divider />

            <Group justify="space-between">
              <Text size="sm" fw={800} c="dimmed">
                Resident Score
              </Text>
              <Text size="sm" fw={800} c="dimmed">
                Latest
              </Text>
            </Group>
            {performanceLists.underperforming.residentScore.slice(0, 3).map((r) => (
              <Group key={r.name} justify="space-between" wrap="nowrap">
                <Text size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                </Text>
                <Text size="sm" fw={900} style={{ color: 'var(--mantine-color-danger-7)' }}>
                  {r.value.toFixed(1)}/5
                </Text>
              </Group>
            ))}
          </Stack>
        </Paper>

        <Paper withBorder radius="lg" p="lg">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text fw={900}>Market Signals</Text>
            <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.12em' }}>
              External context
            </Text>
          </Group>

          <Stack gap="lg" mt="md">
            {[
              {
                label: 'Submarket Rent Growth',
                subLabel: null,
                value: '+1.2%',
                trendTone: 'good' as const,
                dotTone: 'good' as const,
              },
              {
                label: 'New Supply Pipeline',
                subLabel: '1,200 units',
                value: 'High',
                trendTone: 'bad' as const,
                dotTone: 'good' as const,
              },
              {
                label: 'Concession Trend',
                subLabel: null,
                value: '2 Weeks',
                trendTone: 'bad' as const,
                dotTone: 'warn' as const,
              },
              {
                label: 'Median Income',
                subLabel: null,
                value: '+3.5%',
                trendTone: 'good' as const,
                dotTone: 'warn' as const,
              },
            ].map((s) => {
              const trendColor =
                s.trendTone === 'good'
                  ? 'var(--mantine-color-success-7)'
                  : s.trendTone === 'warn'
                    ? 'var(--mantine-color-yellow-7)'
                    : 'var(--mantine-color-danger-7)'
              const dotColor =
                s.dotTone === 'good' ? 'var(--mantine-color-success-6)' : s.dotTone === 'warn' ? 'var(--mantine-color-orange-6)' : 'var(--mantine-color-danger-6)'

              return (
                <Group key={s.label} justify="space-between" align="center" wrap="nowrap">
                  <Stack gap={2} style={{ minWidth: 0 }}>
                    <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                      {s.label}
                    </Text>
                    {s.subLabel && (
                      <Text size="sm" c="dimmed">
                        {s.subLabel}
                      </Text>
                    )}
                  </Stack>

                  <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
                    <Text fw={900} size="lg">
                      {s.value}
                    </Text>
                    <Group gap={8} wrap="nowrap">
                      <Text size="xs" fw={900} style={{ color: trendColor }}>
                        Trend
                      </Text>
                      <Box w={10} h={10} style={{ borderRadius: 999, background: dotColor }} />
                    </Group>
                  </Stack>
                </Group>
              )
            })}

            <Paper withBorder radius="md" p="md" style={{ background: 'var(--mantine-color-body)' }}>
              <Stack gap={4}>
                <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                  Model forecast
                </Text>
                <Text size="sm" c="dimmed" fs="italic">
                  Moderate downward pressure on occupancy expected next 90 days.
                </Text>
              </Stack>
            </Paper>
          </Stack>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Paper withBorder radius="lg" p="lg">
          <Group justify="space-between">
            <Stack gap={4}>
              <Text fw={900}>Benchmark Readiness</Text>
              <Text size="sm" c="dimmed">
                Data availability snapshot for portfolio benchmarking.
              </Text>
            </Stack>
            <Badge variant="light" color="teal" radius="xl">
              Real-time
            </Badge>
          </Group>

          <Divider my="md" />

          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg">
            <Stack gap={4}>
              <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                Properties
              </Text>
              <Text fw={900} size="xl">
                {portfolioStats.totalProperties}
              </Text>
            </Stack>
            <Stack gap={4}>
              <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                Units
              </Text>
              <Text fw={900} size="xl">
                {formatCompactNumber(portfolioStats.units)}
              </Text>
            </Stack>
            <Stack gap={4}>
              <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                Standardization
              </Text>
              <Text fw={900} size="xl">
                —
              </Text>
            </Stack>
            <Stack gap={4}>
              <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                Coverage
              </Text>
              <Text fw={900} size="xl">
                {kpis.evidenceCoveragePct == null ? '—' : `${Math.round(kpis.evidenceCoveragePct)}%`}
              </Text>
            </Stack>
          </SimpleGrid>
        </Paper>

        <Paper withBorder radius="lg" p="lg">
          <Group justify="space-between" align="flex-start">
            <Stack gap={6}>
              <Text fw={900}>Benchmark Pack</Text>
              <Text size="sm" c="dimmed">
                A shareable summary for investment &amp; ops review.
              </Text>
            </Stack>
            <Badge variant="light" color="gray" radius="xl">
              Draft
            </Badge>
          </Group>

          <Divider my="md" />

          <Group>
            <Button variant="light">View</Button>
            <Button variant="outline">PDF</Button>
          </Group>
        </Paper>
      </SimpleGrid>

      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text fw={900}>Property Memory Index</Text>
          <Group gap="sm">
            <TextInput placeholder="Search properties" value={memorySearch} onChange={(e) => setMemorySearch(e.currentTarget.value)} style={{ minWidth: 260 }} />
            <Button variant="light">View all</Button>
          </Group>
        </Group>

        {/* AG Grid must not be wrapped in Paper */}
        <Box className="ag-theme-alpine" style={{ width: '100%', height: 420 }}>
          <AgGridReact<MemoryIndexRow>
            {...AG_GRID_DEFAULT_GRID_PROPS}
            defaultColDef={AG_GRID_DEFAULT_COL_DEF}
            columnDefs={memoryCols}
            rowData={filteredMemoryRows}
            loading={loading || metricsLoading}
          />
        </Box>
      </Stack>
    </Stack>
  )
}

